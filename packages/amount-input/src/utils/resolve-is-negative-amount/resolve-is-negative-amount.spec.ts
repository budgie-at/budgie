import { describe, expect, it } from 'vitest';

import { resolveIsNegativeAmount } from './resolve-is-negative-amount.util';

describe('resolveIsNegativeAmount', () => {
    it.each([
        { name: 'negative for a negative value', isNegative: false, value: -5, expected: true },
        { name: 'positive for a positive value', isNegative: true, value: 5, expected: false },
        { name: 'the chosen negative sign for zero', isNegative: true, value: 0, expected: true },
        { name: 'the chosen positive sign for zero', isNegative: false, value: 0, expected: false }
    ])('keeps $name', ({ isNegative, value, expected }) => {
        expect.hasAssertions();

        expect(resolveIsNegativeAmount(isNegative, value)).toBe(expected);
    });
});
