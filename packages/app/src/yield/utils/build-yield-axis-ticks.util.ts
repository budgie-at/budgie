import { YIELD_AXIS_LABEL_HEIGHT } from '../constant/yield-axis-label-height.constant';

import { getYieldZeroY } from './get-yield-zero-y.util';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';

export const buildYieldAxisTicks = (axis: YieldAxisInterface, height: number) => {
    const zeroY = getYieldZeroY(axis, height);
    const intervals = Math.max(Math.round(axis.top / axis.step), 1);
    const isSpaced = zeroY / intervals >= YIELD_AXIS_LABEL_HEIGHT;

    return {
        zeroY,
        ticks: Array.from({ length: intervals }, (_, index) => {
            const level = intervals - index;

            return { key: index === 0 ? 'top' : `tick-${level}`, y: (zeroY * index) / intervals, value: axis.step * level };
        }).filter(({ key }) => key === 'top' || isSpaced)
    };
};
