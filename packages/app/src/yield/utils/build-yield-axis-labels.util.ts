import type { YieldAxisLabelInterface } from '../interface/yield-axis-label.interface';
import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const LABEL_HEIGHT = 14;

export const buildYieldAxisLabels = (
    axis: YieldAxisInterface,
    height: number,
    format: (value: number) => string
): readonly YieldAxisLabelInterface[] => {
    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const intervals = Math.max(Math.round(axis.top / axis.step), 1);
    const isSpaced = zeroY / intervals >= LABEL_HEIGHT;
    const ticks = Array.from({ length: intervals }, (_, index) => {
        const level = intervals - index;

        return { key: index === 0 ? 'top' : `tick-${level}`, y: (zeroY * index) / intervals, text: format(axis.step * level) };
    }).filter(({ key }) => key === 'top' || isSpaced);

    return [...ticks, { key: 'zero', y: zeroY, text: format(0) }];
};
