export const BrokerageSelector = {
    AddPositionButton: 'Brokerage.AddPositionButton',
    GainLine: 'Brokerage.GainLine',
    TradePage: 'Brokerage.TradePage',
    SearchInput: 'Brokerage.SearchInput',
    Listing: (symbol: string) => `Brokerage.Listing.${symbol}` as const,
    QuantityInput: 'Brokerage.QuantityInput',
    PriceInput: 'Brokerage.PriceInput',
    FeeInput: 'Brokerage.FeeInput',
    DateButton: 'Brokerage.DateButton',
    SaveButton: 'Brokerage.SaveButton',
    SellButton: 'Brokerage.SellButton'
} as const;
