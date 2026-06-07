export const CurrencyMarketPageSelector = {
    Header: (code: string) => `CurrencyMarket.Header.${code}` as const,
    Price: (code: string) => `CurrencyMarket.Price.${code}` as const,
    Rate: (code: string) => `CurrencyMarket.Rate.${code}` as const,
    Change: (code: string) => `CurrencyMarket.Change.${code}` as const,
    Sparkline: (code: string) => `CurrencyMarket.Sparkline.${code}` as const,
    Holdings: (code: string) => `CurrencyMarket.Holdings.${code}` as const,
    HoldingsBalance: (code: string) => `CurrencyMarket.Holdings.Balance.${code}` as const,
    HoldingsValue: (code: string) => `CurrencyMarket.Holdings.Value.${code}` as const,
    AverageCost: (code: string) => `CurrencyMarket.Holdings.AverageCost.${code}` as const,
    CostBasis: (code: string) => `CurrencyMarket.Holdings.CostBasis.${code}` as const,
    UnrealizedProfit: (code: string) => `CurrencyMarket.Holdings.UnrealizedProfit.${code}` as const,
    MarketCap: (code: string) => `CurrencyMarket.MarketCap.${code}` as const,
    Volume: (code: string) => `CurrencyMarket.Volume.${code}` as const,
    Updated: (code: string) => `CurrencyMarket.Updated.${code}` as const
} as const;
