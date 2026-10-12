import { calculateOptimalTextSize } from '@app/@generic/utils/calculate-optimal-text-size.util';
import { describe, expect, it } from '@effect/vitest';

const base = { minFontSize: 12, maxFontSize: 36, defaultSize: 20 };

describe('generic/calculate-optimal-text-size', () => {
    it('falls back to the default size without a measured width', () => {
        expect(calculateOptimalTextSize({ ...base, containerWidth: 0, charCount: 10 })).toBe(20);
    });

    it('uses the max size when everything fits', () => {
        expect(calculateOptimalTextSize({ ...base, containerWidth: 1000, charCount: 5 })).toBe(36);
    });

    it('shrinks to the largest size that fits', () => {
        expect(calculateOptimalTextSize({ ...base, containerWidth: 120, charCount: 10 })).toBe(20);
    });

    it('shrinks to the min size when even the min size does not fit', () => {
        expect(calculateOptimalTextSize({ ...base, containerWidth: 30, charCount: 20 })).toBe(12);
    });
});
