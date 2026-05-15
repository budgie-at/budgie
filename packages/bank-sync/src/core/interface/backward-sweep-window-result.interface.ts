import type { BankSyncBatchResultInterface } from './bank-sync-batch-result.interface';

export interface BackwardSweepWindowResultInterface extends BankSyncBatchResultInterface {
    readonly nextEmptyWindowCount: number;
}
