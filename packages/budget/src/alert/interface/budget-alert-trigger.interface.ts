import type { BudgetAlertKindEnum } from '../enum/budget-alert-kind.enum';
import type { BudgetAlertScopeEnum } from '../enum/budget-alert-scope.enum';

export interface BudgetAlertTriggerInterface {
    readonly kind: BudgetAlertKindEnum;
    readonly scope: BudgetAlertScopeEnum;
    readonly categoryId: number | null;
    readonly threshold: number;
}
