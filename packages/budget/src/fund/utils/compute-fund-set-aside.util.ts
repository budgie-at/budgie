import { computePeriodWindow } from '../../period/utils/budget-period.util';

import type { BudgetPeriodSpecInterface } from '../../period/interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetFundScheduleInterface } from '../interface/budget-fund-schedule.interface';

const MAX_PERIODS_AHEAD = 520;

const countPeriodsUntilDue = (dueAt: Date, window: BudgetPeriodWindowInterface, spec: BudgetPeriodSpecInterface): number => {
    let periods = 1;
    let { nextPeriodStart } = window;

    while (nextPeriodStart.getTime() < dueAt.getTime() && periods < MAX_PERIODS_AHEAD) {
        periods += 1;
        ({ nextPeriodStart } = computePeriodWindow(spec, nextPeriodStart));
    }

    return periods;
};

export const computeFundSetAside = (
    fund: BudgetFundScheduleInterface,
    window: BudgetPeriodWindowInterface,
    spec: BudgetPeriodSpecInterface
): number => {
    const remaining = Math.max(fund.targetAmount - fund.fundedAmount, 0);

    return Math.ceil(remaining / countPeriodsUntilDue(fund.dueAt, window, spec));
};
