import type { YieldScreenContextInterface } from './yield-screen-context.interface';
import type { YieldSelectionContextInterface } from './yield-selection-context.interface';

export interface YieldScreenStateInterface {
    readonly screen: YieldScreenContextInterface;
    readonly selection: YieldSelectionContextInterface;
}
