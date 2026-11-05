export interface InzhurOperationsFundSummaryInterface {
    readonly accountId: number;
    readonly name: string;
    readonly boughtQuantity: number;
    readonly boughtAmount: number;
    readonly soldQuantity: number;
    readonly soldAmount: number;
    readonly dividends: number;
    readonly tax: number;
    readonly isQuantityEstimated: boolean;
}
