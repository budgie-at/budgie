import type { BudgetCategoryLimitMutationRepositoryInterface } from './budget-category-limit-mutation-repository.interface';
import type { BudgetMutationRepositoryInterface } from './budget-mutation-repository.interface';

export interface BudgetServiceDependenciesInterface<Transaction> {
    readonly database: Transaction;
    readonly budgetRepository: BudgetMutationRepositoryInterface<Transaction>;
    readonly budgetCategoryLimitRepository: BudgetCategoryLimitMutationRepositoryInterface<Transaction>;
    readonly runTransaction: <T>(database: Transaction, callback: (tx: Transaction) => Promise<T>) => Promise<T>;
}
