import { describe, expect, it } from '@effect/vitest';

import { parseAmountText } from '../../amount-input/src/utils/parse-amount-text/parse-amount-text.util';
import { normalizeAmountDecimalSeparators } from '../src/@generic/utils/normalize-amount-decimal-separators.util';

describe('fee input decimal separators', () => {
    it.each([
        { text: '12,50', decimalSeparator: '.', groupingSeparator: ',', expected: 12.5 },
        { text: '12.50', decimalSeparator: ',', groupingSeparator: '.', expected: 12.5 },
        { text: '1,234.56', decimalSeparator: '.', groupingSeparator: ',', expected: 1234.56 },
        { text: '1.234,56', decimalSeparator: ',', groupingSeparator: '.', expected: 1234.56 },
        { text: '1.234,56', decimalSeparator: '.', groupingSeparator: ',', expected: 1234.56 },
        { text: '1,234.56', decimalSeparator: ',', groupingSeparator: '.', expected: 1234.56 },
        { text: '1 234,56', decimalSeparator: ',', groupingSeparator: ' ', expected: 1234.56 },
        { text: '1,234,567', decimalSeparator: '.', groupingSeparator: ',', expected: 1234567 },
        { text: '0,01', decimalSeparator: '.', groupingSeparator: ',', expected: 0.01 },
        { text: '', decimalSeparator: '.', groupingSeparator: ',', expected: undefined }
    ])('parses $text with decimal separator $decimalSeparator', ({ text, decimalSeparator, groupingSeparator, expected }) => {
        expect(
            parseAmountText(normalizeAmountDecimalSeparators(text, decimalSeparator, ['.', ',']), {
                decimalSeparator,
                groupingSeparator,
                decimalPlaces: 2
            })?.value
        ).toBe(expected);
    });

    it('preserves existing input behavior unless alternative separators are enabled', () => {
        expect(normalizeAmountDecimalSeparators('12,50', '.', [])).toBe('12,50');
        expect(normalizeAmountDecimalSeparators('12,', '.', ['.', ','])).toBe('12.');
    });
});
