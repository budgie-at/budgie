import { isDefined } from '@rnw-community/shared';

import { BUDGET_DAY_FAR_OVER_ALLOWANCE_MULTIPLIER } from '../constant/budget-day-allowance.constant';
import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

import type { BudgetProjectionDayInterface } from '@budgie/budget';

export const resolveBudgetDayState = (
    day: Pick<BudgetProjectionDayInterface, 'variableSpent'>,
    index: number,
    todayIndex: number,
    dailyAllowance: number
): BudgetDayStateEnum => {
    if (index === todayIndex) {
        return BudgetDayStateEnum.TODAY;
    }

    if (!isDefined(day.variableSpent) || index > todayIndex) {
        return BudgetDayStateEnum.FUTURE;
    }

    if (day.variableSpent === 0) {
        return BudgetDayStateEnum.QUIET;
    }

    if (day.variableSpent > dailyAllowance * BUDGET_DAY_FAR_OVER_ALLOWANCE_MULTIPLIER) {
        return BudgetDayStateEnum.FAR_OVER;
    }

    return day.variableSpent > dailyAllowance ? BudgetDayStateEnum.OVER : BudgetDayStateEnum.WITHIN;
};
