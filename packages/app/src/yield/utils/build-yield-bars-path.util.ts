import type { YieldBarLayerInterface } from '../interface/yield-bar-layer.interface';

const MIN_VISIBLE_HEIGHT = 0.5;
const VALUES_PER_RECT = 2;
const HALF = 2;

export const buildYieldBarsPath = (
    values: readonly number[],
    layer: Pick<YieldBarLayerInterface, 'offset' | 'rects'>,
    isInProgress: boolean,
    visibleBuckets: readonly boolean[] | null = null
): string => {
    'worklet';

    const { offset, rects } = layer;
    const commands: (string | number)[] = [];

    rects.forEach((rect, index) => {
        const y = values[offset + index * VALUES_PER_RECT] ?? 0;
        const height = values[offset + index * VALUES_PER_RECT + 1] ?? 0;

        const isIncluded = visibleBuckets?.[index] ?? true;

        if (height > MIN_VISIBLE_HEIGHT && rect.isInProgress === isInProgress && isIncluded) {
            const radius = Math.min(rect.radius, height, rect.width / HALF);
            const right = rect.x + rect.width;
            const bottom = y + height;

            commands.push(
                'M',
                rect.x,
                bottom,
                'V',
                y + radius,
                'Q',
                rect.x,
                y,
                rect.x + radius,
                y,
                'H',
                right - radius,
                'Q',
                right,
                y,
                right,
                y + radius,
                'V',
                bottom,
                'Z'
            );
        }
    });

    return commands.join(' ');
};
