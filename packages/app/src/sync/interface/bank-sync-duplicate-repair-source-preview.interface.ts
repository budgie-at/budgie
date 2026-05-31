import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourcePreviewInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly title: string;
    readonly duplicateTransactionCount: number;
}
