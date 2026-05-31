import type { BankSyncDuplicateRepairCandidatePreviewInterface } from './bank-sync-duplicate-repair-candidate-preview.interface';
import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourcePreviewInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly title: string;
    readonly duplicateTransactionCount: number;
    readonly candidates: readonly BankSyncDuplicateRepairCandidatePreviewInterface[];
}
