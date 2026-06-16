import type { BudgetAlertBudgetInterface } from './budget-alert-budget.interface';

export interface BudgetAlertTrackedBudgetInterface extends BudgetAlertBudgetInterface {
    readonly id: number;
    readonly periodStartDay: number;
    readonly useLastDayOfMonth: boolean;
}
