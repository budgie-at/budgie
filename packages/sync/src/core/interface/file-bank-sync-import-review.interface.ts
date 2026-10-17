import type { FileBankSyncReviewAccountInterface } from './file-bank-sync-review-account.interface';
import type { FileBankSyncReviewTransactionInterface } from './file-bank-sync-review-transaction.interface';

export interface FileBankSyncImportReviewInterface {
    readonly parsedTransactionCount: number;
    readonly duplicateTransactionCount: number;
    readonly earliestOperatedAt: Date | null;
    readonly latestOperatedAt: Date | null;
    readonly sampleTransactions: readonly FileBankSyncReviewTransactionInterface[];
    readonly accounts: readonly FileBankSyncReviewAccountInterface[];
}
