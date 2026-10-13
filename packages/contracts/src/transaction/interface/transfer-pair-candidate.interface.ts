import { TransferPairAutoConfidenceBucketEnum } from '../enum/transfer-pair-auto-confidence-bucket.enum';

export interface TransferPairCandidateInterface {
    readonly confidenceBucket: TransferPairAutoConfidenceBucketEnum;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly operatedAt: number;
    readonly expenseEntryAccountId: number;
    readonly expenseEntryAmount: number;
    readonly expenseEntryExchangeRate: number;
    readonly expenseEntryToIban: string | null;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly incomeEntryAccountId: number;
    readonly incomeEntryAmount: number;
    readonly incomeEntryExchangeRate: number;
    readonly timeDiff: number;
}
