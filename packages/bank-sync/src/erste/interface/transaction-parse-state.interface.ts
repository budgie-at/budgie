export interface TransactionParseStateInterface {
    readonly currentDescription: string;
    readonly currentDetails: string[];
    readonly currentDate: string;
    readonly currentAmount: string;
    readonly currentIsDebit: boolean;
}
