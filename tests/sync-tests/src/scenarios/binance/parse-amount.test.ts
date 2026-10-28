import { parseBinanceAmount } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';

describe('binance/parse-amount', () => {
    it('parses a whole amount to a major-unit number', () => {
        expect(parseBinanceAmount('1')).toBe(1);
    });

    it('parses a fractional amount', () => {
        expect(parseBinanceAmount('0.5')).toBe(0.5);
    });

    it('truncates sub-1e-6 precision deterministically', () => {
        expect(parseBinanceAmount('0.12345678')).toBe(0.123456);
    });

    it('returns null for a non-numeric value', () => {
        expect(parseBinanceAmount('abc')).toBeNull();
    });

    it('returns null for an empty value', () => {
        expect(parseBinanceAmount('')).toBeNull();
    });

    it('parses an amount whose microunit value exceeds MAX_SAFE_INTEGER', () => {
        expect(parseBinanceAmount('20000000000')).toBe(20_000_000_000);
    });

    it('parses scientific notation', () => {
        expect(parseBinanceAmount('1E-8')).toBe(0);
        expect(parseBinanceAmount('1.5e-3')).toBe(0.0015);
        expect(parseBinanceAmount('2E+2')).toBe(200);
    });

    it('parses a negative amount', () => {
        expect(parseBinanceAmount('-1.5')).toBe(-1.5);
    });

    it('parses a high-supply amount that stays within MAX_SAFE_INTEGER', () => {
        expect(parseBinanceAmount('9007199254')).toBe(9007199254);
    });
});
