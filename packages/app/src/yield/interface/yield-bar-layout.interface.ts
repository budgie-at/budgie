import type { YieldBarRectInterface } from './yield-bar-rect.interface';
import type { YieldGroupEnum } from '@budgie/market';

export interface YieldBarLayoutInterface {
    readonly zeroY: number;
    readonly groups: Readonly<Record<YieldGroupEnum, readonly YieldBarRectInterface[]>>;
    readonly tax: readonly YieldBarRectInterface[];
}
