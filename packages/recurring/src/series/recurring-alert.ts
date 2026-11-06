import { RecurringSeriesSourceEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { isSameDay } from 'date-fns/isSameDay';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { RecurringAlertEnum } from '../enum/recurring-alert.enum';

import { cadencePeriodDays, cadenceToleranceDays, cycleDateAt } from './recurring-schedule';
import { PRICE_CHANGE_RATIO } from './recurring-series';
import { countsInForecasts, isSeriesEnded } from './recurring-state';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringLinkedChargeInterface } from '../interface/recurring-linked-charge.interface';
import type { RecurringPriceChangeInterface } from '../interface/recurring-price-change.interface';
import type { RecurringReadModelInterface } from '../interface/recurring-read-model.interface';

const PRICE_CHANGE_ALERT_DAYS = 183;
const PREVIOUS_AMOUNT_COUNT = 3;

export const isCycleCovered = (model: RecurringReadModelInterface, cycleDate: Date): boolean => {
    const tolerance = cadenceToleranceDays(model.series);

    return model.links.some(
        ({ link, charge }) =>
            !link.isExcluded &&
            (isSameDay(link.cycleDate, cycleDate) || Math.abs(differenceInCalendarDays(charge.operatedAt, cycleDate)) <= tolerance)
    );
};

const findLatestPastCycle = (model: RecurringReadModelInterface, now: Date): Date | null => {
    const today = startOfDay(now);
    const tolerance = cadenceToleranceDays(model.series);
    let cycle = Math.floor(differenceInCalendarDays(today, model.series.anchorDate) / cadencePeriodDays(model.series)) + 1;

    while (cycle >= 0) {
        const cycleDate = cycleDateAt(model.series, cycle);

        if (differenceInCalendarDays(today, cycleDate) > tolerance) {
            return isDefined(model.series.endsAt) && differenceInCalendarDays(cycleDate, model.series.endsAt) > 0 ? null : cycleDate;
        }
        cycle -= 1;
    }

    return null;
};

const isStableAmount = (links: readonly RecurringLinkedChargeInterface[]): boolean => {
    const amounts = links.map(({ charge }) => charge.defaultAmount);

    return Math.max(...amounts) <= Math.min(...amounts) * RECURRING_AMOUNT_RATIO;
};

export const findPriceChange = (model: RecurringReadModelInterface, now: Date): RecurringChargeInterface | null => {
    const linked = model.links
        .filter(({ link }) => !link.isExcluded)
        .sort((first, second) => first.charge.operatedAt.getTime() - second.charge.operatedAt.getTime());
    const changeIndex = linked.findLastIndex(
        (item, index) =>
            index > 0 &&
            Math.abs(item.charge.defaultAmount - linked[index - 1].charge.defaultAmount) >
                linked[index - 1].charge.defaultAmount * PRICE_CHANGE_RATIO &&
            isStableAmount(linked.slice(index)) &&
            isStableAmount(linked.slice(Math.max(0, index - PREVIOUS_AMOUNT_COUNT), index))
    );
    const change = linked[changeIndex]?.charge;

    return isDefined(change) && differenceInCalendarDays(now, change.operatedAt) <= PRICE_CHANGE_ALERT_DAYS ? change : null;
};

export const hasPriceChange = (model: RecurringReadModelInterface, now: Date): boolean => {
    const [latest] = model.links
        .filter(({ link }) => !link.isExcluded)
        .sort((first, second) => second.charge.operatedAt.getTime() - first.charge.operatedAt.getTime());
    const expected = model.series.defaultAmount;
    const isDrift =
        model.series.source === RecurringSeriesSourceEnum.MANUAL &&
        isDefined(latest) &&
        Math.abs(latest.charge.defaultAmount - expected) > expected * PRICE_CHANGE_RATIO;

    return isDrift || isDefined(findPriceChange(model, now));
};

const isEnding = (model: RecurringReadModelInterface, now: Date): boolean =>
    isDefined(model.series.endsAt) &&
    differenceInCalendarDays(model.series.endsAt, startOfDay(now)) >= 0 &&
    differenceInCalendarDays(model.series.endsAt, startOfDay(now)) <= Math.ceil(cadencePeriodDays(model.series));

export const resolveRecurringAlert = (model: RecurringReadModelInterface, now: Date): RecurringAlertEnum | null => {
    if (!countsInForecasts(model.series) || isSeriesEnded(model.series, now)) {
        return null;
    }
    const latestPastCycle = findLatestPastCycle(model, now);

    if (isDefined(latestPastCycle) && !isCycleCovered(model, latestPastCycle)) {
        return RecurringAlertEnum.OVERDUE;
    }
    if (hasPriceChange(model, now)) {
        return RecurringAlertEnum.PRICE_CHANGE;
    }

    return isEnding(model, now) ? RecurringAlertEnum.ENDING : null;
};

export const resolveRecurringPriceChange = (model: RecurringReadModelInterface, now: Date): RecurringPriceChangeInterface | null => {
    const linked = model.links
        .filter(({ link }) => !link.isExcluded)
        .sort((first, second) => first.charge.operatedAt.getTime() - second.charge.operatedAt.getTime());
    const change = findPriceChange(model, now);
    const previous = isDefined(change)
        ? linked.at(linked.findIndex(({ charge }) => charge.transactionId === change.transactionId) - 1)
        : null;
    const latest = linked.at(-1);

    if (isDefined(change) && isDefined(previous)) {
        return {
            fromAmount: Math.round(previous.charge.defaultAmount),
            toAmount: Math.round(change.defaultAmount),
            changedAt: change.operatedAt
        };
    }

    return hasPriceChange(model, now) && isDefined(latest)
        ? { fromAmount: model.series.defaultAmount, toAmount: Math.round(latest.charge.defaultAmount), changedAt: latest.charge.operatedAt }
        : null;
};
