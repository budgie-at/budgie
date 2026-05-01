export interface AtmCashWithdrawalCandidateInterface {
    readonly confidenceBucket: 'AUTO_ATM_CASH_WITHDRAWAL';
    readonly transactionId: number;
    readonly transactionTitle: string | null;
    readonly transactionComment: string | null;
    readonly operatedAt: number;
    readonly entryId: number;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly targetCashAccountId: number;
    readonly targetCashAccountTitle: string;
    readonly currency: string;
    readonly amount: number;
}
