import type { BudgetEntityInterface } from '@budgie/contracts';

export interface UseBudgetFundFormOptionsInterface {
    readonly budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'>;
    readonly editingId: number | null;
}
