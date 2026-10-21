import { isPositiveNumber } from '@rnw-community/shared';

export const getFittedFontSize = (
    baseFontSize: number,
    minimumFontScale: number,
    availableWidth: number,
    measuredWidth: number
): number => {
    if (!isPositiveNumber(availableWidth) || measuredWidth <= availableWidth) {
        return baseFontSize;
    }

    return Math.floor(Math.max(baseFontSize * minimumFontScale, (baseFontSize * availableWidth) / measuredWidth));
};
