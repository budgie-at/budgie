export interface BankSyncDuplicateRepairCandidatePreviewInterface {
    readonly duplicateTransactionId: number;
    readonly keptTransactionId: number;
    readonly title: string;
    readonly duplicateExternalId: string | null;
    readonly keptExternalId: string | null;
}
