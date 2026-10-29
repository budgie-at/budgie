import type { BudgetAlertScopeEnum } from '@budgie/budget';

export interface BudgetHighlightTargetInterface {
    readonly scope: BudgetAlertScopeEnum;
    readonly categoryId?: number;
}
