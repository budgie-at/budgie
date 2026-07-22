import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { isDefined, isError } from '@rnw-community/shared';

import { ERSTE_DUPLICATE_CANDIDATE_SQL } from '../constant/erste-duplicate-candidate-sql.constant';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '../constant/privatbank-duplicate-candidate-sql.constant';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateRepairSourceStrategyInterface } from '../interface/bank-sync-duplicate-repair-source-strategy.interface';
import type { DB } from '@budgie/contracts';

class BankSyncDuplicateRepairSourceService implements BankSyncDuplicateRepairSourceStrategyInterface {
    constructor(
        readonly externalSource: ExternalSourceEnum,
        private readonly candidateSql: string
    ) {}

    @Log.withoutErrorPayload(
        database => `enter database=${String(isDefined(database))}`,
        (result, database) => `done database=${String(isDefined(database))} candidateCount=${result.length}`,
        (error, database) => `throw database=${String(isDefined(database))} errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async findDuplicateCandidates(database: DB): Promise<BankSyncDuplicateCandidateRowInterface[]> {
        return database.$client.getAllAsync<BankSyncDuplicateCandidateRowInterface>(this.candidateSql);
    }
}

export const privatbankDuplicateRepairSourceService = new BankSyncDuplicateRepairSourceService(
    ExternalSourceEnum.PRIVATBANK,
    PRIVATBANK_DUPLICATE_CANDIDATE_SQL
);

export const ersteDuplicateRepairSourceService = new BankSyncDuplicateRepairSourceService(
    ExternalSourceEnum.ERSTE,
    ERSTE_DUPLICATE_CANDIDATE_SQL
);
