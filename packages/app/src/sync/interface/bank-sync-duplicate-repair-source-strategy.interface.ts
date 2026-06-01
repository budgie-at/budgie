import type { BankSyncDuplicateCandidateRowInterface } from './bank-sync-duplicate-candidate-row.interface';
import type { DB, ExternalSourceEnum } from '@budgie/contracts';

export interface BankSyncDuplicateRepairSourceStrategyInterface {
    readonly externalSource: ExternalSourceEnum;

    findDuplicateCandidates(database: DB): Promise<BankSyncDuplicateCandidateRowInterface[]>;
}
