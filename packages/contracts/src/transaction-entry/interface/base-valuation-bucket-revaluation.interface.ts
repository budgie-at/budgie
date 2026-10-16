export interface BaseValuationBucketRevaluationInterface {
    readonly rateDate: string;
    readonly sourceInstrumentId: number;
    readonly baseInstrumentId: number;
    readonly previousBaseExchangeRate: number;
    readonly baseExchangeRate: number;
}
