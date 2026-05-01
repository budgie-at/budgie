export interface AtmCashWithdrawalReviewCandidateInterface {
    readonly confidenceBucket: 'REVIEW_ATM_CASH_WITHDRAWAL';
    readonly transactionId: number;
    readonly transactionTitle: string | null;
    readonly sourceAccountId: number;
    readonly sourceAccountTitle: string;
    readonly currency: string;
    readonly amount: number;
    readonly cashAccountCount: number;
    readonly cashAccountIds: string | null;
}
