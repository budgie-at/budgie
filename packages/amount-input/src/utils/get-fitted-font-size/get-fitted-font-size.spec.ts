import { describe, expect, it } from 'vitest';

import { getFittedFontSize } from './get-fitted-font-size.util';

const BASE_FONT_SIZE = 72;
const MINIMUM_FONT_SCALE = 0.3;

const scalable = (width: number) => ({ width, minimumWidth: 0 });

const getRenderedWidth = (parts: readonly { width: number; minimumWidth: number }[], fontSize: number) =>
    parts.reduce((total, part) => total + Math.max((part.width * fontSize) / BASE_FONT_SIZE, part.minimumWidth), 0);

describe('getFittedFontSize', () => {
    it.each([
        { name: 'the base size before the container is measured', availableWidth: 0, parts: [scalable(400)], expected: 72 },
        { name: 'the base size before the content is measured', availableWidth: 300, parts: [], expected: 72 },
        { name: 'the base size when the content fits', availableWidth: 300, parts: [scalable(250)], expected: 72 },
        { name: 'the base size when the content fits exactly', availableWidth: 300, parts: [scalable(300)], expected: 72 },
        { name: 'a proportionally smaller size for a long value', availableWidth: 300, parts: [scalable(400)], expected: 54 },
        { name: 'a size that never rounds above the fitting width', availableWidth: 301, parts: [scalable(400)], expected: 54 },
        { name: 'the minimum size for a value too long to fit', availableWidth: 300, parts: [scalable(3000)], expected: 21 }
    ])('returns $name', ({ availableWidth, parts, expected }) => {
        expect.hasAssertions();

        expect(getFittedFontSize(BASE_FONT_SIZE, MINIMUM_FONT_SCALE, availableWidth, parts)).toBe(expected);
    });

    it('fits a prefixed balance whose character-count estimate looked short enough', () => {
        expect.hasAssertions();

        const parts = [scalable(52 + 14), scalable(380)];
        const fittedFontSize = getFittedFontSize(BASE_FONT_SIZE, MINIMUM_FONT_SCALE, 320, parts);

        expect(getRenderedWidth(parts, fittedFontSize)).toBeLessThanOrEqual(320);
    });

    it('shrinks the amount further when a suffix symbol stops at its minimum size', () => {
        expect.hasAssertions();

        const parts = [scalable(500), { width: 58, minimumWidth: 44 }];
        const fittedFontSize = getFittedFontSize(BASE_FONT_SIZE, MINIMUM_FONT_SCALE, 300, parts);

        expect(getRenderedWidth(parts, fittedFontSize)).toBeLessThanOrEqual(300);
        expect(getRenderedWidth(parts, fittedFontSize + 1)).toBeGreaterThan(300);
    });
});
