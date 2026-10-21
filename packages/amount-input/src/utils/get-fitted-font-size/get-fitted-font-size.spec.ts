import { describe, expect, it } from 'vitest';

import { getFittedFontSize } from './get-fitted-font-size.util';

const BASE_FONT_SIZE = 72;
const MINIMUM_FONT_SCALE = 0.3;

describe('getFittedFontSize', () => {
    it.each([
        { name: 'the base size before the container is measured', availableWidth: 0, measuredWidth: 400, expected: 72 },
        { name: 'the base size before the content is measured', availableWidth: 300, measuredWidth: 0, expected: 72 },
        { name: 'the base size when the content fits', availableWidth: 300, measuredWidth: 250, expected: 72 },
        { name: 'the base size when the content fits exactly', availableWidth: 300, measuredWidth: 300, expected: 72 },
        { name: 'a proportionally smaller size for a long value', availableWidth: 300, measuredWidth: 400, expected: 54 },
        { name: 'a size that never rounds above the fitting width', availableWidth: 301, measuredWidth: 400, expected: 54 },
        { name: 'the minimum size for a value too long to fit', availableWidth: 300, measuredWidth: 3000, expected: 21 }
    ])('returns $name', ({ availableWidth, measuredWidth, expected }) => {
        expect.hasAssertions();

        expect(getFittedFontSize(BASE_FONT_SIZE, MINIMUM_FONT_SCALE, availableWidth, measuredWidth)).toBe(expected);
    });

    it('fits a prefixed balance whose estimate looked short enough', () => {
        expect.hasAssertions();

        const symbolWidth = 52;
        const symbolGapWidth = 14;
        const amountWidth = 380;
        const fittedFontSize = getFittedFontSize(BASE_FONT_SIZE, MINIMUM_FONT_SCALE, 320, symbolWidth + symbolGapWidth + amountWidth);

        expect(((symbolWidth + symbolGapWidth + amountWidth) * fittedFontSize) / BASE_FONT_SIZE).toBeLessThanOrEqual(320);
    });
});
