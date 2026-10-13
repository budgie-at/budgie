import { isPositiveNumber } from '@rnw-community/shared';

interface Args {
    readonly containerWidth: number;
    readonly charCount: number;
    readonly minFontSize: number;
    readonly maxFontSize: number;
    readonly defaultSize: number;
}

const CHARACTER_WIDTH_RATIO = 0.6;

export const calculateOptimalTextSize = ({ containerWidth, minFontSize, maxFontSize, defaultSize, charCount }: Args) =>
    isPositiveNumber(containerWidth)
        ? Math.min(maxFontSize, Math.max(minFontSize, Math.floor(containerWidth / (charCount * CHARACTER_WIDTH_RATIO))))
        : defaultSize;
