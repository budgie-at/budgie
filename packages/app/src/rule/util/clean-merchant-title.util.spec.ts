import { cleanMerchantTitle } from './clean-merchant-title.util';

describe('cleanMerchantTitle', () => {
    it('should strip MM/DD date format', () => {
        expect(cleanMerchantTitle('NETFLIX 04/02')).toBe('NETFLIX');
    });

    it('should strip DD.MM.YY date format', () => {
        expect(cleanMerchantTitle('SPOTIFY 15.03.24')).toBe('SPOTIFY');
    });

    it('should strip YYYY-MM-DD date format', () => {
        expect(cleanMerchantTitle('AMAZON 2024-03-15')).toBe('AMAZON');
    });

    it('should strip reference numbers with hash', () => {
        expect(cleanMerchantTitle('UBER EATS #8821')).toBe('UBER EATS');
    });

    it('should strip REF# references', () => {
        expect(cleanMerchantTitle('WALMART REF#ABC123')).toBe('WALMART');
    });

    it('should strip long numeric sequences', () => {
        expect(cleanMerchantTitle('STARBUCKS 1234567890')).toBe('STARBUCKS');
    });

    it('should strip USD amount', () => {
        expect(cleanMerchantTitle('NETFLIX USD 15.99')).toBe('NETFLIX');
    });

    it('should strip currency symbol amounts', () => {
        expect(cleanMerchantTitle('SPOTIFY $9.99')).toBe('SPOTIFY');
    });

    it('should strip euro symbol amounts', () => {
        expect(cleanMerchantTitle('LIDL \u20AC12.50')).toBe('LIDL');
    });

    it('should strip .COM suffix', () => {
        expect(cleanMerchantTitle('NETFLIX.COM')).toBe('NETFLIX');
    });

    it('should strip INC suffix', () => {
        expect(cleanMerchantTitle('APPLE INC')).toBe('APPLE');
    });

    it('should strip LLC suffix', () => {
        expect(cleanMerchantTitle('ACME LLC')).toBe('ACME');
    });

    it('should strip GMBH suffix', () => {
        expect(cleanMerchantTitle('LIDL GMBH')).toBe('LIDL');
    });

    it('should handle complex bank title with multiple patterns', () => {
        expect(cleanMerchantTitle('NETFLIX.COM 04/02 #8821 USD 15.99')).toBe('NETFLIX');
    });

    it('should collapse excessive whitespace', () => {
        expect(cleanMerchantTitle('UBER   EATS   DELIVERY')).toBe('UBER EATS DELIVERY');
    });

    it('should fall back to original if cleaned result is too short', () => {
        expect(cleanMerchantTitle('AB 04/02 #1234')).toBe('AB 04/02 #1234');
    });

    it('should return trimmed original for very short titles', () => {
        expect(cleanMerchantTitle('  X  ')).toBe('X');
    });

    it('should handle title with only strippable content gracefully', () => {
        const result = cleanMerchantTitle('04/02 #8821 USD 15.99');
        expect(result).toBe('04/02 #8821 USD 15.99');
    });

    it('should handle DD-MM-YYYY date format', () => {
        expect(cleanMerchantTitle('SILPO 15-03-2024')).toBe('SILPO');
    });

    it('should strip LTD suffix', () => {
        expect(cleanMerchantTitle('TESCO LTD')).toBe('TESCO');
    });

    it('should preserve clean merchant names', () => {
        expect(cleanMerchantTitle('WHOLE FOODS MARKET')).toBe('WHOLE FOODS MARKET');
    });
});
