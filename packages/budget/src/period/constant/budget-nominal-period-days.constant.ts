import { BudgetPeriodEnum } from '@budgie/contracts';

export const BUDGET_NOMINAL_PERIOD_DAYS: Readonly<Record<BudgetPeriodEnum, number>> = {
    [BudgetPeriodEnum.WEEKLY]: 7,
    [BudgetPeriodEnum.BIWEEKLY]: 14,
    [BudgetPeriodEnum.MONTHLY]: 30.4375,
    [BudgetPeriodEnum.YEARLY]: 365.25
};
