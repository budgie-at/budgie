import { describe, expect, it } from 'vitest';

import { applyAmountSign } from './apply-amount-sign.util';

describe('applyAmountSign', () => {
    it.each([
        { name: 'a positive amount', absoluteValue: 40.5, isNegative: false, expected: 40.5 },
        { name: 'a negative amount', absoluteValue: 40.5, isNegative: true, expected: -40.5 },
        { name: 'zero without a negative sign', absoluteValue: 0, isNegative: true, expected: 0 }
    ])('returns $name', ({ absoluteValue, isNegative, expected }) => {
        expect.hasAssertions();

        expect(applyAmountSign(absoluteValue, isNegative)).toBe(expected);
    });
});
