import type { ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateCandidateRowInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly duplicateTransactionId: number;
    readonly keptTransactionId: number;
    readonly reason: string;
}
