import { normalizeAccountIban } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

describe('account/iban-normalization', () => {
    it('returns null for absent, empty and whitespace values', () => {
        expect(normalizeAccountIban(null)).toBeNull();
        expect(normalizeAccountIban(undefined)).toBeNull();
        expect(normalizeAccountIban('')).toBeNull();
        expect(normalizeAccountIban('   ')).toBeNull();
    });

    it('strips spaces and uppercases a valid IBAN', () => {
        expect(normalizeAccountIban('at48 1200 0100 1234 5678')).toBe('AT481200010012345678');
        expect(normalizeAccountIban('AT48 1200 0100 1234 5678')).toBe('AT481200010012345678');
    });

    it('returns null for values that cannot satisfy the account IBAN rule', () => {
        expect(normalizeAccountIban('UA11111111234')).toBeNull();
        expect(normalizeAccountIban('12345678901234567')).toBeNull();
        expect(normalizeAccountIban('AT48-1200-0100-1234')).toBeNull();
        expect(normalizeAccountIban('A481200010012345678')).toBeNull();
    });

    it('preserves an already valid IBAN unchanged', () => {
        expect(normalizeAccountIban('UA00PRIVATBANK1234')).toBe('UA00PRIVATBANK1234');
    });
});
