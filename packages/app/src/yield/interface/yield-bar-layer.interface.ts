import type { YieldBarRectInterface } from './yield-bar-rect.interface';
import type { YieldGroupEnum } from '@budgie/market';

export interface YieldBarLayerInterface {
    readonly group: YieldGroupEnum;
    readonly offset: number;
    readonly rects: readonly YieldBarRectInterface[];
    readonly fillClassName: string;
}
