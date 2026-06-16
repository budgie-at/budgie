import type { BudgetCategoryLimitInputInterface } from './budget-category-limit-input.interface';

export interface BudgetTemplateDraftInterface {
    readonly overallLimit: number;
    readonly categoryLimits: readonly BudgetCategoryLimitInputInterface[];
}
