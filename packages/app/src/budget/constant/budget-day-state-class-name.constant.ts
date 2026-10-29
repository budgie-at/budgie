import { BudgetDayStateEnum } from '../enum/budget-day-state.enum';

export const BUDGET_DAY_STATE_CLASS_NAME: Record<BudgetDayStateEnum, readonly string[]> = {
    [BudgetDayStateEnum.FUTURE]: ['h-[14px]', 'bg-secondary-corner'],
    [BudgetDayStateEnum.TODAY]: ['h-[18px]', 'bg-primary'],
    [BudgetDayStateEnum.QUIET]: ['h-[14px]', 'bg-primary/10'],
    [BudgetDayStateEnum.WITHIN]: ['h-[14px]', 'bg-primary/40'],
    [BudgetDayStateEnum.OVER]: ['h-[14px]', 'bg-warning-fill'],
    [BudgetDayStateEnum.FAR_OVER]: ['h-[14px]', 'bg-destructive-fill']
};
