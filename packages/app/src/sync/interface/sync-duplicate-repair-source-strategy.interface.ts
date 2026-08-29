import type { SyncDuplicateCandidateRowInterface } from './sync-duplicate-candidate-row.interface';
import type { DB, ExternalSourceEnum } from '@budgie/contracts';

export interface SyncDuplicateRepairSourceStrategyInterface {
    readonly externalSource: ExternalSourceEnum;

    findDuplicateCandidates(database: DB): Promise<SyncDuplicateCandidateRowInterface[]>;
}
