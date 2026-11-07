export interface InzhurOperationsFundSummaryInterface {
    readonly accountId: number;
    readonly name: string;
    readonly boughtQuantity: number;
    readonly boughtAmount: number;
    readonly soldQuantity: number;
    readonly soldAmount: number;
    readonly convertedInQuantity: number;
    readonly convertedInAmount: number;
    readonly convertedInFrom: string | null;
    readonly isConvertedInEstimated: boolean;
    readonly convertedOutQuantity: number;
    readonly convertedOutTo: string | null;
    readonly dividends: number;
    readonly tax: number;
}
