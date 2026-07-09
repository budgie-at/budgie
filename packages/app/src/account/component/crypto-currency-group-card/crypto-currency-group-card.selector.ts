export const CryptoCurrencyGroupCardSelector = {
    Card: (instrumentCode: string) => `CryptoGroup.Card.${instrumentCode}` as const,
    Container: (instrumentCode: string) => `CryptoGroup.Container.${instrumentCode}` as const,
    Market: (instrumentCode: string) => `CryptoGroup.Market.${instrumentCode}` as const,
    Balance: (instrumentCode: string) => `CryptoGroup.Balance.${instrumentCode}` as const,
    Value: (instrumentCode: string) => `CryptoGroup.Value.${instrumentCode}` as const,
    Toggle: (instrumentCode: string) => `CryptoGroup.Toggle.${instrumentCode}` as const,
    AccountCount: (instrumentCode: string) => `CryptoGroup.AccountCount.${instrumentCode}` as const,
    Rate: (instrumentCode: string) => `CryptoGroup.Rate.${instrumentCode}` as const
} as const;
