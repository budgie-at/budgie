import { isPositiveNumber } from '@rnw-community/shared';

import type { AmountFieldPartWidthInterface } from '../../interface/amount-field-part-width.interface';

export const getFittedFontSize = (
    baseFontSize: number,
    minimumFontScale: number,
    availableWidth: number,
    partWidths: readonly AmountFieldPartWidthInterface[]
): number => {
    const getPinnedParts = (fontSize: number) => partWidths.filter(part => (part.width * fontSize) / baseFontSize < part.minimumWidth);
    const getRenderedWidth = (fontSize: number) =>
        partWidths.reduce((total, part) => total + Math.max((part.width * fontSize) / baseFontSize, part.minimumWidth), 0);

    if (!isPositiveNumber(availableWidth) || getRenderedWidth(baseFontSize) <= availableWidth) {
        return baseFontSize;
    }

    const fittingFontSize = partWidths.reduce(fontSize => {
        const pinnedParts = getPinnedParts(fontSize);
        const pinnedWidth = pinnedParts.reduce((total, part) => total + part.minimumWidth, 0);
        const scalableWidth = partWidths.filter(part => !pinnedParts.includes(part)).reduce((total, part) => total + part.width, 0);

        return isPositiveNumber(scalableWidth) ? (baseFontSize * (availableWidth - pinnedWidth)) / scalableWidth : fontSize;
    }, baseFontSize);

    return Math.floor(Math.max(baseFontSize * minimumFontScale, fittingFontSize));
};
