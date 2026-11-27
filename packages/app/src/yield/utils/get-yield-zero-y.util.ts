import type { YieldAxisInterface } from '../interface/yield-axis.interface';

export const getYieldZeroY = (axis: Pick<YieldAxisInterface, 'top' | 'bottom'>, height: number): number =>
    (axis.top * height) / (axis.top - axis.bottom);
