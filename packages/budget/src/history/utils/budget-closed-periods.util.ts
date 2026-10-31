import { isDefined } from '@rnw-community/shared';

import { computePeriodWindow, getInclusiveEnd } from '../../period/utils/budget-period.util';

import type { BudgetPeriodSpecInterface } from '../../period/interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';

const BACKFILL_PERIOD_COUNT = 6;
const CATCH_UP_PERIOD_COUNT = 12;

const findPreviousWindow = (spec: BudgetPeriodSpecInterface, boundary: Date): BudgetPeriodWindowInterface =>
    computePeriodWindow(spec, getInclusiveEnd(boundary));

const isWithinRange = (window: BudgetPeriodWindowInterface, latestPeriodStart: Date | null, earliestOperatedAt: Date | null): boolean => {
    const isAfterLatest = !isDefined(latestPeriodStart) || window.periodStart.getTime() > latestPeriodStart.getTime();
    const hasHistory = !isDefined(earliestOperatedAt) || window.nextPeriodStart.getTime() > earliestOperatedAt.getTime();

    return isAfterLatest && hasHistory;
};

export const computeClosedPeriods = (
    spec: BudgetPeriodSpecInterface,
    now: Date,
    latestPeriodStart: Date | null,
    earliestOperatedAt: Date | null
): readonly BudgetPeriodWindowInterface[] => {
    if (!isDefined(latestPeriodStart) && !isDefined(earliestOperatedAt)) {
        return [];
    }

    const limit = isDefined(latestPeriodStart) ? CATCH_UP_PERIOD_COUNT : BACKFILL_PERIOD_COUNT;
    const windows: BudgetPeriodWindowInterface[] = [];
    let window = findPreviousWindow(spec, computePeriodWindow(spec, now).periodStart);

    while (windows.length < limit && isWithinRange(window, latestPeriodStart, earliestOperatedAt)) {
        windows.unshift(window);
        window = findPreviousWindow(spec, window.periodStart);
    }

    return windows;
};
