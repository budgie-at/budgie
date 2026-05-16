import type { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

export interface BudgetAlertTriggerInterface {
    readonly scope: BudgetAlertScopeEnum;
    readonly categoryId: number | null;
    readonly threshold: number;
}
