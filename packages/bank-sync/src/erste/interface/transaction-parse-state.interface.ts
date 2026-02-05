export interface TransactionParseStateInterface {
    readonly currentReference: string;
    readonly currentContinuationLines: string[];
    readonly currentDate: string;
    readonly currentAmount: string;
    readonly currentIsDebit: boolean;
}
