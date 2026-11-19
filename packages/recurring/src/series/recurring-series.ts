import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import * as Arr from 'effect/Array';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { continueRecurringSeries } from './recurring-continuation';
import { fitRecurringStream, median } from './recurring-stream';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringStreamContextInterface } from '../interface/recurring-stream-context.interface';

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
    context: RecurringStreamContextInterface,
    keySuffix: string
): RecurringSeriesInterface | null => {
    const stream = fitRecurringStream(toEvents(charges), context);
    if (!isDefined(stream)) {
        return null;
    }
    const { events } = stream;
    const streamIds = new Set(events.map(event => event.transactionId));
    const latest = charges
        .filter(charge => streamIds.has(charge.transactionId))
        .reduce((current, charge) => (charge.operatedAt.getTime() > current.operatedAt.getTime() ? charge : current));
    const priceChangeIndex = context.isVariable
        ? -1
        : events.findLastIndex(
              (event, index) =>
                  index > 0 &&
                  Math.abs(event.nativeAmount - events[index - 1].nativeAmount) > events[index - 1].nativeAmount * PRICE_CHANGE_RATIO &&
                  isStableAmount(events.slice(index)) &&
                  isStableAmount(events.slice(Math.max(0, index - RECENT_AMOUNT_COUNT), index))
          );
    const nativeAmount = Math.round(
        median(
            (priceChangeIndex > 0 ? events.slice(priceChangeIndex) : events.slice(-RECENT_AMOUNT_COUNT)).map(event => event.nativeAmount)
        )
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
        labels: [...new Set([identity(latest), normalizeRecurringDescription(description(latest)), ...charges.map(legacyLabel)])],
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
    const fixed = amountClusters(charges)
        .map(cluster => buildSeries(cluster, { ...context, isVariable: false }, `|${cluster[0].nativeAmount}`))
        .filter(isDefined);
    const claimedIds = new Set(fixed.flatMap(series => series.events.map(event => event.transactionId)));
    const claimedKeys = new Set(charges.filter(charge => claimedIds.has(charge.transactionId)).map(duplicateKey));
    const unclaimed = charges.filter(charge => !claimedKeys.has(duplicateKey(charge)));
    const variable =
        isNotEmptyArray(unclaimed) && !isStableAmount(context.merchantEvents)
            ? buildSeries(unclaimed, { ...context, isVariable: true }, '')
            : null;
    const series = [...fixed, variable].filter(isDefined);

    return series.filter(
        candidate =>
            !series.some(other => other.periodDays === candidate.periodDays && other.events[0].timestamp > candidate.lastSeenTimestamp)
    );
};

const familyKey = (charge: RecurringChargeInterface): string => `${charge.kind}|${counterpartyKey(charge)}`;

const hasLaterSibling = (group: readonly RecurringChargeInterface[], family: readonly (readonly RecurringChargeInterface[])[]): boolean => {
    const firstTimestamp = Math.min(...group.map(charge => charge.operatedAt.getTime()));

    return family.some(sibling => sibling !== group && sibling.some(charge => charge.operatedAt.getTime() >= firstTimestamp));
};

export const detectRecurringSeries = (charges: readonly RecurringChargeInterface[]): RecurringSeriesInterface[] => {
    const groups = Object.values(
        Arr.groupBy(
            charges.filter(charge => isNotEmptyString(identity(charge))),
            identity
        )
    );
    const families = Arr.groupBy(groups, group => familyKey(group[0]));
    const detected = groups.flatMap(group => {
        const merchantEvents = toEvents(group);

        return detectMerchantSeries(group, {
            merchantEvents,
            hasIban: isNotEmptyString(group[0].counterpartyIban),
            isIsolatedPair: merchantEvents.length === 2 && !hasLaterSibling(group, families[familyKey(group[0])])
        });
    });

    return continueRecurringSeries(detected);
};
