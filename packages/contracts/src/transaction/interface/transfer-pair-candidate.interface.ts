import type { TransferPairAutoConfidenceBucket } from './transfer-pair-auto-confidence-bucket.type';

export interface TransferPairCandidateInterface {
    readonly confidenceBucket: TransferPairAutoConfidenceBucket;
    readonly expenseTransactionId: number;
    readonly expenseTransactionTitle: string | null;
    readonly expenseTransactionComment: string | null;
    readonly operatedAt: number;
    readonly expenseEntryId: number;
    readonly expenseEntryAccountId: number;
    readonly expenseEntryAmount: number;
    readonly expenseEntryExchangeRate: number;
    readonly expenseEntryToIban: string | null;
    readonly incomeTransactionId: number;
    readonly incomeTransactionTitle: string | null;
    readonly incomeEntryId: number;
    readonly incomeEntryAccountId: number;
    readonly incomeEntryAmount: number;
    readonly incomeEntryExchangeRate: number;
    readonly incomeEntryToIban: string | null;
    readonly matchType: 'iban' | 'amount' | 'operation-amount' | 'implied-rate' | 'same-bank-hinted-fee' | 'interbank-hinted-fee';
    readonly timeDiff: number;
}
