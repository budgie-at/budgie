import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetQueryResultInterface {
    readonly budget: BudgetEntityInterface | null;
    readonly isLoading: boolean;
}
