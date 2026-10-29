export interface TransactionDayNetAmountRowInterface {
    readonly day: string;
    readonly amount: number;
    readonly baseAmount: number;
    readonly instrumentSymbol: string;
    readonly instrumentCount: number;
    readonly unvaluedCount: number;
}
