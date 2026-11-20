import type { YieldAxisLabelInterface } from '../interface/yield-axis-label.interface';
import type { YieldAxisInterface } from '../interface/yield-axis.interface';

const LABEL_HEIGHT = 14;
const HALF = 2;
const LABEL_GAP = 4;
const ZERO_LABEL = '0';
const MINUS = '−';

export const buildYieldAxisLabels = (
    axis: YieldAxisInterface,
    height: number,
    format: (value: number) => string
): readonly YieldAxisLabelInterface[] => {
    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const bottomDistance = height - zeroY;
    const hasBottom = axis.bottom < 0 && bottomDistance >= LABEL_HEIGHT + LABEL_GAP;
    const isMidVisible = zeroY >= LABEL_HEIGHT * HALF;
    const candidates = [
        { key: 'top', y: 0, text: format(axis.top), isVisible: true },
        { key: 'mid', y: zeroY / HALF, text: format(axis.top / HALF), isVisible: isMidVisible },
        { key: 'zero', y: zeroY, text: ZERO_LABEL, isVisible: true },
        { key: 'bottom', y: height, text: `${MINUS}${format(-axis.bottom)}`, isVisible: hasBottom }
    ];

    return candidates.filter(({ isVisible }) => isVisible).map(({ key, y, text }) => ({ key, y, text }));
};
