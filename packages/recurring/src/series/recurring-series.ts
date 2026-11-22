import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { continueRecurringSeries, continueRecurringStream } from './recurring-continuation';
import { groupRecurringPayees } from './recurring-payee';
import { fitRecurringStream, median } from './recurring-stream';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringStreamContextInterface } from '../interface/recurring-stream-context.interface';
import type { RecurringStreamInterface } from '../interface/recurring-stream.interface';

const LEGACY_STOP_TOKENS = new Set('GMBH AG KG CO INC LTD LLC OG ФОП ТОВ ПП ПАТ АТ ВІД'.split(' '));
const IDENTITY_TOKEN_SEPARATOR = /[^\p{L}\p{N}]+/u;
const DISPLAY_TOKEN_SEPARATOR = /(?:[^\p{L}\p{N}'’]|(?<![\p{L}\p{N}])['’]|['’](?![\p{L}\p{N}]))+/u;

const cleanDescriptionTokens = (text: string, referenceTail: RegExp, numericToken: RegExp, separator: RegExp): string[] =>
    text
        .replace(referenceTail, '')
        .replaceAll(/\bGES\.?\s*M\.?\s*B\.?\s*H\.?/giu, ' ')
        .split(separator)
        .filter(token => isNotEmptyString(token) && !numericToken.test(token) && !LEGACY_STOP_TOKENS.has(token.toUpperCase()));
const RECENT_AMOUNT_COUNT = 3;
export const PRICE_CHANGE_RATIO = 0.05;
export const ACTIVE_PERIOD_RATIO = 1.5;

export const description = (charge: RecurringChargeInterface): string => (isNotEmptyString(charge.title) ? charge.title : charge.comment);

export const counterpartyKey = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(charge.counterpartyIban)
        ? charge.counterpartyIban.replaceAll(/\s/gu, '').toUpperCase()
        : normalizeRecurringDescription(description(charge));

export const identity = (charge: RecurringChargeInterface): string =>
    isNotEmptyString(counterpartyKey(charge)) ? `${charge.kind}|${charge.instrumentId}|${counterpartyKey(charge)}` : '';

export const legacyLabel = (charge: RecurringChargeInterface): string =>
    cleanDescriptionTokens(
        description(charge),
        /(MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO).*$/iu,
        /^\d+$|\d{3,}/u,
        IDENTITY_TOKEN_SEPARATOR
    )
        .join(' ')
        .toUpperCase();

const duplicateKey = (charge: RecurringChargeInterface): string =>
    `${charge.accountId}|${startOfDay(charge.operatedAt).getTime()}|${charge.nativeAmount}`;

const toEvents = (charges: readonly RecurringChargeInterface[]): RecurringSeriesEventInterface[] => {
    const events: RecurringSeriesEventInterface[] = [];
    const seen = new Set<string>();
    for (const charge of [...charges].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime())) {
        if (!seen.has(duplicateKey(charge))) {
            seen.add(duplicateKey(charge));
            events.push({
                timestamp: startOfDay(charge.operatedAt).getTime(),
                nativeAmount: charge.nativeAmount,
                defaultAmount: charge.defaultAmount,
                transactionId: charge.transactionId
            });
        }
    }

    return events;
};

const isStableAmount = (events: readonly RecurringSeriesEventInterface[]): boolean =>
    Math.max(...events.map(event => event.nativeAmount)) <= Math.min(...events.map(event => event.nativeAmount)) * RECURRING_AMOUNT_RATIO;

const buildSeries = (
    charges: readonly RecurringChargeInterface[],
    stream: RecurringStreamInterface,
    isVariable: boolean,
    keySuffix: string
): RecurringSeriesInterface => {
    const { events } = stream;
    const streamIds = new Set(events.map(event => event.transactionId));
    const latest = charges
        .filter(charge => streamIds.has(charge.transactionId))
        .reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const priceChangeIndex = isVariable
        ? -1
        : events.findLastIndex(
              (event, index) =>
                  index > 0 &&
                  index < events.length - 1 &&
                  Math.abs(event.nativeAmount - events[index - 1].nativeAmount) > events[index - 1].nativeAmount * PRICE_CHANGE_RATIO &&
                  isStableAmount(events.slice(index)) &&
                  isStableAmount(events.slice(Math.max(0, index - RECENT_AMOUNT_COUNT), index))
          );
    const nativeAmount = Math.round(
        median(events.slice(Math.max(0, priceChangeIndex, events.length - RECENT_AMOUNT_COUNT)).map(event => event.nativeAmount))
    );
    const displayTokens = cleanDescriptionTokens(
        description(latest),
        /\b(?:MDID|UID|MREF|MLREF|IBAN|RECHNUNGSNR|BRUTTO)\b.*$/iu,
        /^\d+$|\d{6,}/u,
        DISPLAY_TOKEN_SEPARATOR
    ).slice(0, 3);

    return {
        kind: latest.kind,
        instrumentId: latest.instrumentId,
        nativeAmount,
        merchantKey: `${identity(latest)}${keySuffix}`,
        labels: [
            ...new Set([
                identity(latest),
                normalizeRecurringDescription(description(latest)),
                ...charges.map(identity),
                ...charges.map(legacyLabel)
            ])
        ],
        title: isNotEmptyArray(displayTokens) ? displayTokens.join(' ') : description(latest).trim().split(/\s+/u).slice(0, 3).join(' '),
        categoryId: latest.categoryId,
        ...stream.cadence,
        anchorTimestamp: stream.anchorTimestamp,
        lastSeenTimestamp: events[events.length - 1].timestamp,
        confidence: stream.confidence,
        events
    };
};

export const isSeriesActive = (series: RecurringSeriesInterface, now: Date): boolean =>
    differenceInCalendarDays(now, new Date(series.lastSeenTimestamp)) <= series.periodDays * ACTIVE_PERIOD_RATIO;

const amountClusters = (charges: readonly RecurringChargeInterface[]): RecurringChargeInterface[][] => {
    const clusters: RecurringChargeInterface[][] = [];
    for (const charge of [...charges].sort((first, second) => first.nativeAmount - second.nativeAmount)) {
        const cluster = clusters[clusters.length - 1];
        if (isDefined(cluster) && charge.nativeAmount <= cluster[0].nativeAmount * RECURRING_AMOUNT_RATIO) {
            cluster.push(charge);
        } else {
            clusters.push([charge]);
        }
    }

    return clusters;
};

const detectMerchantSeries = (
    charges: readonly RecurringChargeInterface[],
    context: Omit<RecurringStreamContextInterface, 'isVariable'>
): RecurringSeriesInterface[] => {
    const clusters = amountClusters(charges);
    const fitted = clusters.map(cluster => fitRecurringStream(toEvents(cluster), { ...context, isVariable: false }));
    const claimedIds = new Set(fitted.flatMap(stream => stream?.events.map(event => event.transactionId) ?? []));
    const fixed: RecurringSeriesInterface[] = [];
    for (const [index, stream] of fitted.entries()) {
        if (isDefined(stream)) {
            const continued = continueRecurringStream(
                stream,
                context.merchantEvents.filter(event => !claimedIds.has(event.transactionId))
            );
            const continuedIds = new Set(continued.events.map(event => event.transactionId));
            continuedIds.forEach(transactionId => claimedIds.add(transactionId));
            fixed.push(
                buildSeries(
                    [...clusters[index], ...charges.filter(charge => continuedIds.has(charge.transactionId))],
                    continued,
                    false,
                    `|${clusters[index][0].nativeAmount}`
                )
            );
        }
    }
    const claimedKeys = new Set(charges.filter(charge => claimedIds.has(charge.transactionId)).map(duplicateKey));
    const unclaimed = charges.filter(charge => !claimedKeys.has(duplicateKey(charge)));
    const variableStream =
        isNotEmptyArray(unclaimed) && !isStableAmount(context.merchantEvents)
            ? fitRecurringStream(toEvents(unclaimed), { ...context, isVariable: true })
            : null;
    const series = isDefined(variableStream) ? [...fixed, buildSeries(unclaimed, variableStream, true, '')] : fixed;

    return series.filter(
        candidate =>
            !series.some(other => other.periodDays === candidate.periodDays && other.events[0].timestamp > candidate.lastSeenTimestamp)
    );
};

const familyKey = (charge: RecurringChargeInterface): string => `${charge.kind}|${counterpartyKey(charge)}`;

const hasLaterSibling = (
    group: readonly RecurringChargeInterface[],
    families: ReadonlyMap<string, ReadonlySet<readonly RecurringChargeInterface[]>>
): boolean => {
    const firstTimestamp = Math.min(...group.map(charge => charge.operatedAt.getTime()));

    return group.some(item =>
        [...(families.get(familyKey(item)) ?? [])].some(
            sibling => sibling !== group && sibling.some(charge => charge.operatedAt.getTime() >= firstTimestamp)
        )
    );
};

export const detectRecurringSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const groups = groupRecurringPayees(charges.filter(charge => isNotEmptyString(identity(charge))));
    const families = new Map<string, Set<readonly RecurringChargeInterface[]>>();
    for (const group of groups) {
        for (const charge of group) {
            families.set(familyKey(charge), (families.get(familyKey(charge)) ?? new Set()).add(group));
        }
    }
    const detected = groups.flatMap(group => {
        const merchantEvents = toEvents(group);

        return detectMerchantSeries(group, {
            merchantEvents,
            hasIban: group.every(charge => isNotEmptyString(charge.counterpartyIban)),
            isIsolatedPair: merchantEvents.length === 2 && !hasLaterSibling(group, families)
        });
    });

    return continueRecurringSeries(detected);
};
