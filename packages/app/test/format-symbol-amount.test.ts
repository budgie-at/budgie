import { describe, expect, it } from '@effect/vitest';

import { formatSymbolAmount } from '../src/i18n/utils/format-symbol-amount.util';

const format = (locale: string, value: number, symbol: string, fractionDigits: number, notation: 'standard' | 'compact' = 'standard') =>
    formatSymbolAmount(value, symbol, absolute =>
        new Intl.NumberFormat(locale, {
            notation,
            minimumFractionDigits: notation === 'compact' ? 0 : fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(absolute)
    );

describe('formatSymbolAmount', () => {
    it('places the minus before the symbol for en', () => {
        expect(format('en-US', -642.8, '$', 2)).toBe('-$642.80');
    });

    it('keeps positive amounts unchanged', () => {
        expect(format('en-US', 642.8, '$', 2)).toBe('$642.80');
        expect(format('uk-UA', 9644, '₴', 0)).toBe(`₴${new Intl.NumberFormat('uk-UA').format(9644)}`);
    });

    it('places the minus before the symbol for uk', () => {
        expect(format('uk-UA', -9644, '₴', 0)).toBe(`-₴${new Intl.NumberFormat('uk-UA').format(9644)}`);
    });

    it('uses the locale minus sign and separators for de', () => {
        expect(format('de-DE', -642.8, '€', 2)).toBe('-€642,80');
    });

    it('handles compact notation', () => {
        expect(format('en-US', -253000, '₴', 0, 'compact')).toBe('-₴253K');
    });

    it('supports crypto codes and trailing-space symbols', () => {
        expect(format('en-US', -1.5, 'BTC ', 1)).toBe('-BTC 1.5');
    });
});
