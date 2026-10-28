import { isDefined } from '@rnw-community/shared';

import { computePeriodWindow, getInclusiveEnd } from '../../period/utils/budget-period.util';

import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

type ClosedPeriodsBudgetType = Pick<BudgetEntityInterface, 'periodStartDay' | 'useLastDayOfMonth'>;

const BACKFILL_PERIOD_COUNT = 6;
const CATCH_UP_PERIOD_COUNT = 12;

const findPreviousWindow = (budget: ClosedPeriodsBudgetType, boundary: Date): BudgetPeriodWindowInterface =>
    computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, getInclusiveEnd(boundary));

const isWithinRange = (window: BudgetPeriodWindowInterface, latestPeriodStart: Date | null, earliestOperatedAt: Date | null): boolean => {
    const isAfterLatest = !isDefined(latestPeriodStart) || window.periodStart.getTime() > latestPeriodStart.getTime();
    const hasHistory = !isDefined(earliestOperatedAt) || window.nextPeriodStart.getTime() > earliestOperatedAt.getTime();

    return isAfterLatest && hasHistory;
};

export const computeClosedPeriods = (
    budget: ClosedPeriodsBudgetType,
    now: Date,
    latestPeriodStart: Date | null,
    earliestOperatedAt: Date | null
): readonly BudgetPeriodWindowInterface[] => {
    if (!isDefined(latestPeriodStart) && !isDefined(earliestOperatedAt)) {
        return [];
    }

    const limit = isDefined(latestPeriodStart) ? CATCH_UP_PERIOD_COUNT : BACKFILL_PERIOD_COUNT;
    const windows: BudgetPeriodWindowInterface[] = [];
    let window = findPreviousWindow(budget, computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, now).periodStart);

    while (windows.length < limit && isWithinRange(window, latestPeriodStart, earliestOperatedAt)) {
        windows.unshift(window);
        window = findPreviousWindow(budget, window.periodStart);
    }

    return windows;
};
