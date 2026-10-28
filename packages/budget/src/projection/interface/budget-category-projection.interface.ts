import type { BudgetProjectionScopeInterface } from './budget-projection-scope.interface';

export interface BudgetCategoryProjectionInterface extends BudgetProjectionScopeInterface {
    readonly categoryId: number;
}
