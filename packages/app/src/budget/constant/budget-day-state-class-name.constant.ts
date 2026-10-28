import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

export const BUDGET_DAY_STATE_CLASS_NAME: Record<BudgetDayStateEnum, readonly string[]> = {
    [BudgetDayStateEnum.ELAPSED]: ['bg-secondary-corner'],
    [BudgetDayStateEnum.TODAY]: ['border-2', 'border-primary'],
    [BudgetDayStateEnum.FUTURE]: ['bg-secondary-corner']
};
