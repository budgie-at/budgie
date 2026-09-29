import type { SyncDuplicateCandidateRowInterface } from './sync-duplicate-candidate-row.interface';
import type { Db, DbError, ExternalSourceEnum } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export interface SyncDuplicateRepairSourceStrategyInterface {
    readonly externalSource: ExternalSourceEnum;

    readonly findDuplicateCandidates: () => Effect.Effect<SyncDuplicateCandidateRowInterface[], DbError, Db>;
}
