import { describe, expect, it } from 'vitest';

import { parseAmountText } from './parse-amount-text.util';

const COMMA_FORMAT = { decimalSeparator: ',', groupingSeparator: ' ', decimalPlaces: 2 };
const DOT_FORMAT = { decimalSeparator: '.', groupingSeparator: ',', decimalPlaces: 2 };

describe('parseAmountText', () => {
    it.each([
        { name: 'grouped integer', text: '405 000', format: COMMA_FORMAT, expected: { text: '405000', value: 405_000 } },
        { name: 'locale decimal', text: '12,5', format: COMMA_FORMAT, expected: { text: '12,5', value: 12.5 } },
        { name: 'trailing decimal separator', text: '12,', format: COMMA_FORMAT, expected: { text: '12,', value: 12 } },
        { name: 'extra fraction digits', text: '1.239', format: DOT_FORMAT, expected: { text: '1239', value: 1239 } },
        {
            name: 'nine digit grouped value',
            text: '123,456,789.00',
            format: DOT_FORMAT,
            expected: { text: '123456789.00', value: 123_456_789 }
        }
    ])('parses $name', ({ text, format, expected }) => {
        expect.hasAssertions();

        expect(parseAmountText(text, format)).toStrictEqual(expected);
    });

    it('returns null when nothing numeric is left', () => {
        expect.hasAssertions();

        expect(parseAmountText('abc', DOT_FORMAT)).toBeNull();
    });
});
