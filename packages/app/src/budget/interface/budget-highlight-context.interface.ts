import type { BudgetHighlightTargetInterface } from './budget-highlight-target.interface';
import type { View } from 'react-native';

export interface BudgetHighlightContextInterface {
    readonly target: BudgetHighlightTargetInterface | null;
    readonly hint: BudgetHighlightTargetInterface | null;
    readonly reveal: (view: View) => void;
}
