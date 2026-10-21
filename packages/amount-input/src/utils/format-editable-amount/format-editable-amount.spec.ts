import { describe, expect, it } from 'vitest';

import { formatEditableAmount } from './format-editable-amount.util';

describe('formatEditableAmount', () => {
    it.each([
        { name: 'zero as empty text', value: 0, decimalSeparator: '.', decimalPlaces: 2, expected: '' },
        { name: 'integer without grouping', value: 405_000, decimalSeparator: ',', decimalPlaces: 2, expected: '405000' },
        { name: 'fraction with the locale separator', value: 1234.5, decimalSeparator: ',', decimalPlaces: 2, expected: '1234,5' },
        { name: 'fraction rounded to the decimal places', value: 0.123_456, decimalSeparator: '.', decimalPlaces: 4, expected: '0.1235' },
        { name: 'fraction dropped without decimal places', value: 12.7, decimalSeparator: '.', decimalPlaces: 0, expected: '13' }
    ])('formats $name', ({ value, decimalSeparator, decimalPlaces, expected }) => {
        expect.hasAssertions();

        expect(formatEditableAmount(value, decimalSeparator, decimalPlaces)).toBe(expected);
    });
});
