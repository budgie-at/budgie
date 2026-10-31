import type { BudgetWindowSourceInterface } from './budget-window-source.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetProjectionSourceInterface
    extends
        BudgetWindowSourceInterface,
        Pick<BudgetEntityInterface, 'id' | 'limitSource' | 'instrumentId' | 'overallLimit' | 'otherLimit' | 'tagId'> {}
