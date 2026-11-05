import { describe, expect, it } from '@effect/vitest';

import { formatKeypadAmount } from '../src/transaction/utils/format-keypad-amount.util';

describe('transaction keypad presentation', () => {
    it.each([
        ['.', ',', '1,234,567.89'],
        [',', ' ', '1 234 567,89'],
        [',', '.', '1.234.567,89']
    ])('formats decimal %s with grouping %s', (decimalSeparator, groupingSeparator, expected) => {
        expect(formatKeypadAmount('1234567.89', decimalSeparator, groupingSeparator)).toBe(expected);
    });

    it.each(['12.', '12.0', '12.00', '0.', '0.000001'])('preserves the active input buffer %s', amount => {
        expect(formatKeypadAmount(amount, ',', '')).toBe(amount.replace('.', ','));
    });

    it.each([
        ['12.3', '12.30'],
        ['12', '12.00'],
        ['0.000001', '0.000001'],
        ['1234567.891234', '1234567.891234']
    ])('pads initial %s without removing stored precision', (amount, expected) => {
        expect(formatKeypadAmount(amount, '.', '', 2)).toBe(expected);
        expect(Number(formatKeypadAmount(amount, '.', '', 2))).toBe(Number(amount));
    });
});
