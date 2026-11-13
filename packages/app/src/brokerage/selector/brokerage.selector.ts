export const BrokerageSelector = {
    AddPositionButton: 'Brokerage.AddPositionButton',
    GainLine: 'Brokerage.GainLine',
    PriceHint: 'Brokerage.PriceHint',
    TradePage: 'Brokerage.TradePage',
    SearchInput: 'Brokerage.SearchInput',
    SecurityButton: 'Brokerage.SecurityButton',
    Listing: (symbol: string) => `Brokerage.Listing.${symbol}` as const,
    QuantityInput: 'Brokerage.QuantityInput',
    PriceInput: 'Brokerage.PriceInput',
    FeeInput: 'Brokerage.FeeInput',
    DateButton: 'Brokerage.DateButton',
    SaveButton: 'Brokerage.SaveButton',
    SellButton: 'Brokerage.SellButton',
    Holding: 'Brokerage.Holding',
    TradeTotal: 'Brokerage.TradeTotal',
    QuantityHint: 'Brokerage.QuantityHint',
    PositionGainLine: 'Brokerage.PositionGainLine'
} as const;
