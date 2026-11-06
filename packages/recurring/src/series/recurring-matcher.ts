import { RecurringSeriesSourceEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { matchesRecurringTitle } from '../utils/matches-recurring-title.util';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import { cadenceToleranceDays, nearestCycleDate } from './recurring-schedule';
import { description, identity } from './recurring-series';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringMatchSeriesInterface } from '../interface/recurring-match-series.interface';
import type { RecurringMatchInterface } from '../interface/recurring-match.interface';

const IDENTITY_SEGMENTS = 3;
const MANUAL_AMOUNT_RATIO = 2;

export const merchantIdentityOf = (merchantKey: string): string => merchantKey.split('|').slice(0, IDENTITY_SEGMENTS).join('|');

const matchesMerchant = (
    entry: RecurringMatchSeriesInterface,
    merchantKey: string,
    charge: RecurringChargeInterface,
    chargeIdentity: string
): boolean => {
    if (isNotEmptyString(merchantKey)) {
        return (
            isNotEmptyString(chargeIdentity) &&
            (merchantIdentityOf(merchantKey) === chargeIdentity || entry.userIdentities.has(chargeIdentity))
        );
    }
    const title = normalizeRecurringDescription(entry.series.title);

    return matchesRecurringTitle(title, normalizeRecurringDescription(description(charge)));
};

const rankCandidates = (
    charge: RecurringChargeInterface,
    entries: readonly RecurringMatchSeriesInterface[],
    merchantKeys: ReadonlyMap<number, string>
) => {
    const chargeIdentity = identity(charge);
    const operatedDay = startOfDay(charge.operatedAt);

    return entries
        .filter(
            entry =>
                ((entry.series.source === RecurringSeriesSourceEnum.DETECTED && entry.isVariable === true) ||
                    Math.max(entry.series.defaultAmount, charge.defaultAmount) <=
                        Math.min(entry.series.defaultAmount, charge.defaultAmount) *
                            (entry.series.source === RecurringSeriesSourceEnum.MANUAL ? MANUAL_AMOUNT_RATIO : RECURRING_AMOUNT_RATIO)) &&
                entry.series.kind === charge.kind &&
                !entry.excludedTransactionIds.has(charge.transactionId) &&
                (!isDefined(entry.series.accountId) || entry.series.accountId === charge.accountId) &&
                matchesMerchant(entry, merchantKeys.get(entry.series.id) ?? '', charge, chargeIdentity)
        )
        .map(entry => ({ entry, cycle: nearestCycleDate(entry.series, operatedDay) }))
        .filter(
            ({ entry, cycle }) =>
                cycle.deviationDays <= cadenceToleranceDays(entry.series) &&
                (!isDefined(entry.series.endsAt) || differenceInCalendarDays(cycle.cycleDate, entry.series.endsAt) <= 0)
        )
        .map(candidate => ({ ...candidate, gap: Math.abs(candidate.entry.series.defaultAmount - charge.defaultAmount) }))
        .sort((first, second) => first.gap - second.gap);
};

export const matchRecurringTransactions = (
    charges: readonly RecurringChargeInterface[],
    entries: readonly RecurringMatchSeriesInterface[]
): RecurringMatchInterface[] => {
    const merchantKeys = new Map(entries.map(entry => [entry.series.id, entry.series.merchantKey]));
    const occupied = new Map(entries.map(entry => [entry.series.id, entry.occupiedCycles]));
    const groups = new Map<string, { charge: RecurringChargeInterface; seriesId: number; cycleDate: Date; gap: number }[]>();

    for (const charge of charges) {
        const ranked = rankCandidates(charge, entries, merchantKeys);
        const best = ranked.at(0);
        const runnerUp = ranked.at(1);

        if (isDefined(best) && best.gap !== runnerUp?.gap && best.entry.series.userState !== RecurringSeriesUserStateEnum.DISMISSED) {
            const seriesId = best.entry.series.id;
            const groupKey = `${seriesId}:${best.cycle.cycleDate.getTime()}`;

            if (occupied.get(seriesId)?.has(best.cycle.cycleDate.getTime()) !== true) {
                groups.set(groupKey, [
                    ...(groups.get(groupKey) ?? []),
                    { charge, seriesId, cycleDate: best.cycle.cycleDate, gap: best.gap }
                ]);
            }
        }
    }

    return [...groups.values()]
        .flatMap(group => {
            const sorted = [...group].sort((first, second) => first.gap - second.gap);
            const [closest] = sorted;
            const runnerUp = sorted.at(1);

            return closest.gap === runnerUp?.gap ? [] : [closest];
        })
        .sort((first, second) => first.charge.operatedAt.getTime() - second.charge.operatedAt.getTime())
        .map(({ charge, seriesId, cycleDate }) => {
            const chargeIdentity = identity(charge);
            const needsMerchantKey = !isNotEmptyString(merchantKeys.get(seriesId)) && isNotEmptyString(chargeIdentity);

            if (needsMerchantKey) {
                merchantKeys.set(seriesId, chargeIdentity);
            }

            return { seriesId, transactionId: charge.transactionId, cycleDate, merchantKey: needsMerchantKey ? chargeIdentity : null };
        });
};
