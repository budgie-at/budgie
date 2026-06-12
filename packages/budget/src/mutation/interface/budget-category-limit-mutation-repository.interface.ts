import type {
    BudgetCategoryLimitBulkUpdateInputInterface,
    BudgetCategoryLimitCreateEntityInterface,
    BudgetCategoryLimitEntityInterface
} from '@budgie/contracts';

export interface BudgetCategoryLimitMutationRepositoryInterface<Transaction> {
    readonly bulkCreate: (
        inputs: BudgetCategoryLimitCreateEntityInterface[],
        tx?: Transaction
    ) => Promise<BudgetCategoryLimitEntityInterface[]>;
    readonly bulkUpdate: (
        updates: BudgetCategoryLimitBulkUpdateInputInterface[],
        tx?: Transaction
    ) => Promise<BudgetCategoryLimitEntityInterface[]>;
    readonly bulkDelete: (ids: number[], tx?: Transaction) => Promise<void>;
    readonly getByBudget: (budgetId: number, tx?: Transaction) => Promise<BudgetCategoryLimitEntityInterface[]>;
}
