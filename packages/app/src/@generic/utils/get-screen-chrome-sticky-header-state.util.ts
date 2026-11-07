import type { ScreenChromeStickyHeaderMetricInterface } from '../interface/screen-chrome-sticky-header-metric.interface';
import type { ScreenChromeStickyHeaderStateInterface } from '../interface/screen-chrome-sticky-header-state.interface';

export const getScreenChromeStickyHeaderState = (
    metrics: readonly ScreenChromeStickyHeaderMetricInterface[],
    offset: number
): ScreenChromeStickyHeaderStateInterface => {
    'worklet';

    let start = 0;
    let end = metrics.length - 1;
    let index = -1;

    while (start <= end) {
        const middle = Math.floor((start + end) / 2);

        if (metrics[middle].offset <= offset) {
            index = middle;
            start = middle + 1;
        } else {
            end = middle - 1;
        }
    }

    if (index < 0) {
        return { index, height: 0, translateY: 0 };
    }

    const { height } = metrics[index];
    const nextOffset = metrics[index + 1]?.offset ?? Number.POSITIVE_INFINITY;
    const translateY = Math.min(0, nextOffset - offset - height);

    return { index, height: Math.max(0, height + translateY), translateY };
};
