import type { YieldBarRectInterface } from '../interface/yield-bar-rect.interface';

const MIN_VISIBLE_HEIGHT = 0.5;
const VALUES_PER_RECT = 2;
const HALF = 2;

export const buildYieldBarsPath = (values: readonly number[], offset: number, rects: readonly YieldBarRectInterface[]): string => {
    'worklet';

    let path = '';

    rects.forEach((rect, index) => {
        const y = values[offset + index * VALUES_PER_RECT] ?? 0;
        const height = values[offset + index * VALUES_PER_RECT + 1] ?? 0;

        if (height > MIN_VISIBLE_HEIGHT) {
            const radius = Math.min(rect.radius, height, rect.width / HALF);
            const right = rect.x + rect.width;

            path += [
                'M',
                rect.x,
                ',',
                y + height,
                'V',
                y + radius,
                'Q',
                rect.x,
                ',',
                y,
                ',',
                rect.x + radius,
                ',',
                y,
                'H',
                right - radius,
                'Q',
                right,
                ',',
                y,
                ',',
                right,
                ',',
                y + radius,
                'V',
                y + height,
                'Z'
            ].join('');
        }
    });

    return path;
};
