import type { ExternalSourceEnum } from '@budgie/contracts';

export interface SyncDuplicateRepairSourcePreviewInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly duplicateTransactionCount: number;
}
