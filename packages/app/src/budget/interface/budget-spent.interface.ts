import type { BudgetCategorySpentInterface } from './budget-category-spent.interface';

export interface BudgetSpentInterface {
    readonly spentOverall: number;
    readonly spentByCategory: readonly BudgetCategorySpentInterface[];
    readonly fallbackCount: number;
}
