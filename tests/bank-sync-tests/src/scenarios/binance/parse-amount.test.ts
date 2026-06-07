import { binanceMapper } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

describe('binance/parse-amount', () => {
    it('parses a whole amount to a major-unit number', () => {
        expect(binanceMapper.parseBinanceAmount('1')).toBe(1);
    });

    it('parses a fractional amount', () => {
        expect(binanceMapper.parseBinanceAmount('0.5')).toBe(0.5);
    });

    it('truncates sub-1e-6 precision deterministically', () => {
        expect(binanceMapper.parseBinanceAmount('0.12345678')).toBe(0.123456);
    });

    it('returns null for a non-numeric value', () => {
        expect(binanceMapper.parseBinanceAmount('abc')).toBeNull();
    });

    it('returns null for an empty value', () => {
        expect(binanceMapper.parseBinanceAmount('')).toBeNull();
    });

    it('returns null when the microunit value would exceed MAX_SAFE_INTEGER', () => {
        expect(binanceMapper.parseBinanceAmount('99999999999')).toBeNull();
    });

    it('parses a high-supply amount that stays within MAX_SAFE_INTEGER', () => {
        expect(binanceMapper.parseBinanceAmount('9007199254')).toBe(9007199254);
    });
});
