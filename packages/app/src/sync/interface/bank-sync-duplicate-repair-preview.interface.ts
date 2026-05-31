import type { BankSyncDuplicateRepairSourcePreviewInterface } from './bank-sync-duplicate-repair-source-preview.interface';

export interface BankSyncDuplicateRepairPreviewInterface {
    readonly duplicateTransactionCount: number;
    readonly sources: readonly BankSyncDuplicateRepairSourcePreviewInterface[];
}
