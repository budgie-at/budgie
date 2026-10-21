import { describe, expect, it } from 'vitest';

import { sanitizeAmountText } from './sanitize-amount-text.util';

describe('sanitizeAmountText', () => {
    it('keeps the decimal separator when the fraction fits the decimal places', () => {
        expect.hasAssertions();

        expect(sanitizeAmountText('12,50', ',', ' ', 2)).toBe('12,50');
    });

    it('drops grouping separators and letters', () => {
        expect.hasAssertions();

        expect(sanitizeAmountText('1 234a', ',', ' ', 2)).toBe('1234');
    });

    it('drops the decimal separator when no decimal places are allowed', () => {
        expect.hasAssertions();

        expect(sanitizeAmountText('12,5', ',', ' ', 0)).toBe('125');
    });

    it('keeps a trailing separator typed as the decimal point', () => {
        expect.hasAssertions();

        expect(sanitizeAmountText('12.', ',', ' ', 2)).toBe('12,');
    });

    it('returns an empty string for empty input', () => {
        expect.hasAssertions();

        expect(sanitizeAmountText('', ',', ' ', 2)).toBe('');
    });
});
