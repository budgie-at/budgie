import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const LABEL_HEIGHT = 14;

export const buildYieldAxisTicks = (axis: YieldAxisInterface, height: number) => {
    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const intervals = Math.max(Math.round(axis.top / axis.step), 1);
    const isSpaced = zeroY / intervals >= LABEL_HEIGHT;

    return {
        zeroY,
        ticks: Array.from({ length: intervals }, (_, index) => {
            const level = intervals - index;

            return { key: index === 0 ? 'top' : `tick-${level}`, y: (zeroY * index) / intervals, value: axis.step * level };
        }).filter(({ key }) => key === 'top' || isSpaced)
    };
};
