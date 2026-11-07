export interface InzhurCostReturnInterface {
    readonly invested: number;
    readonly proceeds: number;
    readonly dividends: number;
    readonly tax: number;
    readonly value: number;
    readonly returnAmount: number;
    readonly percent: number | null;
}
