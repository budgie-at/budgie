import type { YieldBarRectInterface } from './yield-bar-rect.interface';
import type { YieldGroupEnum } from '@budgie/market';

export interface YieldBarLayoutInterface {
    readonly xs: readonly number[];
    readonly slot: number;
    readonly barWidth: number;
    readonly zeroY: number;
    readonly groups: Readonly<Record<YieldGroupEnum, readonly YieldBarRectInterface[]>>;
    readonly estimated: Readonly<Record<YieldGroupEnum, readonly YieldBarRectInterface[]>>;
    readonly tax: readonly YieldBarRectInterface[];
}
