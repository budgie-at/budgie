import type { ExternalSourceEnum } from '@budgie/contracts';

export interface SyncDuplicateCandidateRowInterface {
    readonly externalSource: ExternalSourceEnum;
    readonly duplicateTransactionId: number;
    readonly keptTransactionId: number;
    readonly reason: string;
}
