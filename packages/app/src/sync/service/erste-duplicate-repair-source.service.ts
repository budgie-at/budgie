import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { ERSTE_DUPLICATE_CANDIDATE_SQL } from '../constant/erste-duplicate-candidate-sql.constant';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateRepairSourceStrategyInterface } from '../interface/bank-sync-duplicate-repair-source-strategy.interface';
import type { DB } from '@budgie/contracts';

class ErsteDuplicateRepairSourceService implements BankSyncDuplicateRepairSourceStrategyInterface {
    readonly externalSource = ExternalSourceEnum.ERSTE;

    @Log(
        database => `enter database=${String(isDefined(database))}`,
        (result, database) =>
            `done database=${String(isDefined(database))} duplicateTransactionIds=${result.map(candidate => candidate.duplicateTransactionId).join(',')}`,
        (error, database) => `throw database=${String(isDefined(database))} error=${getErrorMessage(error)}`
    )
    async findDuplicateCandidates(database: DB): Promise<BankSyncDuplicateCandidateRowInterface[]> {
        return database.$client.getAllAsync<BankSyncDuplicateCandidateRowInterface>(ERSTE_DUPLICATE_CANDIDATE_SQL);
    }
}

export const ersteDuplicateRepairSourceService = new ErsteDuplicateRepairSourceService();
