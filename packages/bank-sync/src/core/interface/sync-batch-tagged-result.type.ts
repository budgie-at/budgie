import type { BackwardSweepWindowResultInterface } from './backward-sweep-window-result.interface';
import type { BankSyncBatchResultInterface } from './bank-sync-batch-result.interface';

export type SyncBatchTaggedResult =
    | { readonly kind: 'forward'; readonly result: BankSyncBatchResultInterface }
    | { readonly kind: 'backward'; readonly result: BackwardSweepWindowResultInterface };
