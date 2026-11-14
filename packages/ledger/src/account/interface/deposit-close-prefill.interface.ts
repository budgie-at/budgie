export interface DepositClosePrefillInterface {
    readonly ledgerBalance: number;
    readonly amountReceived: number;
    readonly hasUnassignedInterest: boolean;
}
