import type { BankSyncDuplicateRepairSourcePreviewInterface } from './bank-sync-duplicate-repair-source-preview.interface';

export interface BankSyncDuplicateRepairResultInterface {
    readonly repairedTransactionCount: number;
    readonly repairedEntryCount: number;
    readonly sources: readonly BankSyncDuplicateRepairSourcePreviewInterface[];
}
