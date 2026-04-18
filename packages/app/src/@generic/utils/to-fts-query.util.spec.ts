import { toFtsQuery } from './to-fts-query.util';

describe('toFtsQuery', () => {
    it('returns null for empty input', () => {
        expect(toFtsQuery('')).toBeNull();
        expect(toFtsQuery('   ')).toBeNull();
    });

    it('appends prefix wildcard to single token', () => {
        expect(toFtsQuery('sta')).toBe('sta*');
    });

    it('appends prefix wildcard only to the last token', () => {
        expect(toFtsQuery('new yor')).toBe('new yor*');
    });

    it('strips FTS5 reserved characters', () => {
        expect(toFtsQuery('star"buck*s')).toBe('starbucks*');
        expect(toFtsQuery('a(b)c:d')).toBe('abcd*');
    });

    it('trims whitespace', () => {
        expect(toFtsQuery('  hello world  ')).toBe('hello world*');
    });

    it('returns null if sanitization strips all content', () => {
        expect(toFtsQuery('*()":')).toBeNull();
    });
});
