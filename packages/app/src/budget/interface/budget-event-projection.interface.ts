import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

export interface BudgetEventProjectionInterface {
    readonly budget: BudgetEntityInterface;
    readonly projection: BudgetProjectionInterface;
}
