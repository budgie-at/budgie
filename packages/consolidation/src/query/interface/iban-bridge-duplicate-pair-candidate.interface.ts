export interface IbanBridgeDuplicatePairCandidateInterface {
    readonly pairTransactionId: number;
    readonly bridgeTransactionId: number;
    readonly sourceExpenseTransactionId: number;
    readonly targetIncomeTransactionId: number;
}
