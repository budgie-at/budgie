import type { BudgetEffectiveCategoryLimitInterface } from '@budgie/budget';

export interface BudgetWidgetChipSelectionInterface {
    readonly visible: readonly BudgetEffectiveCategoryLimitInterface[];
    readonly hiddenCount: number;
}
