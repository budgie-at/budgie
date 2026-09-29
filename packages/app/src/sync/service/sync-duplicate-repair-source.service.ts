import { Db, ExternalSourceEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { ERSTE_DUPLICATE_CANDIDATE_SQL } from '../constant/erste-duplicate-candidate-sql.constant';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '../constant/privatbank-duplicate-candidate-sql.constant';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateRepairSourceStrategyInterface } from '../interface/sync-duplicate-repair-source-strategy.interface';

class SyncDuplicateRepairSourceService implements SyncDuplicateRepairSourceStrategyInterface {
    readonly findDuplicateCandidates = Effect.fn('SyncDuplicateRepairSourceService.findDuplicateCandidates')(
        function* (this: SyncDuplicateRepairSourceService) {
            return yield* Db.query(db => db.$client.getAllAsync<SyncDuplicateCandidateRowInterface>(this.candidateSql));
        }
    );

    constructor(
        readonly externalSource: ExternalSourceEnum,
        private readonly candidateSql: string
    ) {}
}

export const privatbankDuplicateRepairSourceService = new SyncDuplicateRepairSourceService(
    ExternalSourceEnum.PRIVATBANK,
    PRIVATBANK_DUPLICATE_CANDIDATE_SQL
);

export const ersteDuplicateRepairSourceService = new SyncDuplicateRepairSourceService(
    ExternalSourceEnum.ERSTE,
    ERSTE_DUPLICATE_CANDIDATE_SQL
);
