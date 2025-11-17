import { isPositiveNumber } from '@rnw-community/shared';

interface Args {
    readonly containerWidth: number;
    readonly charCount: number;
    readonly minFontSize: number;
    readonly maxFontSize: number;
    readonly defaultSize: number;
}

export const calculateOptimalTextSize = ({ containerWidth, minFontSize, maxFontSize, defaultSize, charCount }: Args) => {
    if (!isPositiveNumber(containerWidth)) {
        return defaultSize;
    }

    let minSize = minFontSize;
    let maxSize = maxFontSize;
    let optimalSize = maxSize;

    while (minSize <= maxSize) {
        const midSize = Math.floor((minSize + maxSize) / 2);
        const totalWidth = charCount * (midSize * 0.6);

        if (totalWidth <= containerWidth) {
            optimalSize = midSize;
            minSize = midSize + 1;
        } else {
            maxSize = midSize - 1;
        }
    }

    return optimalSize;
};
