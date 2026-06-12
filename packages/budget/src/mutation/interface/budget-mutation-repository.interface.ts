import type { BudgetCreateEntityInterface, BudgetEntityInterface, BudgetUpdateEntityInterface } from '@budgie/contracts';

export interface BudgetMutationRepositoryInterface<Transaction> {
    readonly create: (input: BudgetCreateEntityInterface, tx?: Transaction) => Promise<BudgetEntityInterface>;
    readonly update: (id: number, input: BudgetUpdateEntityInterface, tx?: Transaction) => Promise<BudgetEntityInterface>;
    readonly delete: (id: number, tx?: Transaction) => Promise<void>;
}
