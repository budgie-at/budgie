export interface MarketPricedEntryPageInterface {
    readonly instrumentId: number;
    readonly fromDate: string;
    readonly toDate: string;
    readonly afterId: number;
    readonly limit: number;
}
