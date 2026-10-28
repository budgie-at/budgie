import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

export const BUDGET_DAY_STATE_CLASS_NAME: Record<BudgetDayStateEnum, readonly string[]> = {
    [BudgetDayStateEnum.ELAPSED]: [],
    [BudgetDayStateEnum.TODAY]: ['border-[1.5px]', 'border-primary'],
    [BudgetDayStateEnum.FUTURE]: ['bg-secondary-corner']
};
