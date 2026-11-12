export interface InstrumentPositionInterface {
    readonly realizedProfitLoss: number;
    readonly amount: number;
    readonly costBasis: number | null;
    readonly averageCost: number | null;
}
