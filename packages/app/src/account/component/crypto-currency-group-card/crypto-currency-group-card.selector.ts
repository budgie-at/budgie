export const CryptoCurrencyGroupCardSelector = {
    Market: (instrumentCode: string) => `CryptoGroup.Market.${instrumentCode}` as const,
    Toggle: (instrumentCode: string) => `CryptoGroup.Toggle.${instrumentCode}` as const
} as const;
