import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourcePreviewInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly duplicateTransactionCount: number;
}
