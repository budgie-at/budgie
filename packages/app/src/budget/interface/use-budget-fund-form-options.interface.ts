import type { BudgetWindowSourceInterface } from './budget-window-source.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

export interface UseBudgetFundFormOptionsInterface {
    readonly budget: Pick<BudgetEntityInterface, 'id' | 'instrumentId'> & BudgetWindowSourceInterface;
    readonly editingId: number | null;
}
