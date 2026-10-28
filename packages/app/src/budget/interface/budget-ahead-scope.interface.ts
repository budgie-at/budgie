import type { BudgetHighlightTargetInterface } from './budget-highlight-target.interface';
import type { BudgetProjectionScopeInterface } from '@budgie/budget';

export interface BudgetAheadScopeInterface {
    readonly target: BudgetHighlightTargetInterface;
    readonly scope: BudgetProjectionScopeInterface;
}
