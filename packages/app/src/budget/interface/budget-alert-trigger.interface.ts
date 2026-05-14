import type { BudgetAlertScopeEnum } from '@budgie/contracts';

export interface BudgetAlertTriggerInterface {
    readonly scope: BudgetAlertScopeEnum;
    readonly categoryId: number | null;
    readonly threshold: number;
}
