import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../../../sync/interface/bank-sync-duplicate-repair-source-preview.interface';

export interface BankSyncRepairSourceListPropsInterface {
    readonly isVisible: boolean;
    readonly sources: readonly BankSyncDuplicateRepairSourcePreviewInterface[];
}
