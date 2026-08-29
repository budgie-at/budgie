import type { SyncDuplicateRepairSourcePreviewInterface } from './sync-duplicate-repair-source-preview.interface';

export interface SyncDuplicateRepairPreviewInterface {
    readonly duplicateTransactionCount: number;
    readonly sources: readonly SyncDuplicateRepairSourcePreviewInterface[];
}
