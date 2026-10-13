import { describe, expect, it } from '@effect/vitest';

import { sanitizeAmountText } from '../src/@generic/utils/sanitize-amount-text.util';

describe('sanitizeAmountText', () => {
    it('keeps the decimal separator when the fraction fits the decimal places', () => {
        expect(sanitizeAmountText('12,50', ',', ' ', 2)).toBe('12,50');
    });

    it('drops grouping separators and letters', () => {
        expect(sanitizeAmountText('1 234a', ',', ' ', 2)).toBe('1234');
    });

    it('drops the decimal separator when no decimal places are allowed', () => {
        expect(sanitizeAmountText('12,5', ',', ' ', 0)).toBe('125');
    });

    it('returns an empty string for empty input', () => {
        expect(sanitizeAmountText('', ',', ' ', 2)).toBe('');
    });
});
