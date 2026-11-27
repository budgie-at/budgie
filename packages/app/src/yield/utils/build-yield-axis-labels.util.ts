import { buildYieldAxisTicks } from './build-yield-axis-ticks.util';

import type { YieldAxisLabelInterface } from '../interface/yield-axis-label.interface';
import type { YieldAxisInterface } from '../interface/yield-axis.interface';

export const buildYieldAxisLabels = (
    axis: YieldAxisInterface,
    height: number,
    format: (value: number) => string
): readonly YieldAxisLabelInterface[] => {
    const { zeroY, ticks } = buildYieldAxisTicks(axis, height);

    return [...ticks.map(({ key, y, value }) => ({ key, y, text: format(value) })), { key: 'zero', y: zeroY, text: format(0) }];
};
