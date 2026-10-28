export interface BudgetEffectiveCategoryLimitInterface {
    readonly categoryId: number;
    readonly limitAmount: number;
    readonly carriedAmount: number;
}

export interface BudgetEffectiveLimitsInterface {
    readonly overallLimit: number;
    readonly otherLimit: number;
    readonly otherCarriedAmount: number;
    readonly categoryLimits: readonly BudgetEffectiveCategoryLimitInterface[];
}
