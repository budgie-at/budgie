import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from '../sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from '../sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from '../sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    DB,
    ExistingTransferBridgeCandidateInterface,
    ExistingTransferChainReclaimCandidateInterface,
    ExistingTransferIncomeDuplicateCandidateInterface
} from '@budgie/contracts';

export class ExistingTransferRepository {
    constructor(private db: DB) {}

    async findBridgeCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<ExistingTransferBridgeCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferBridgeCandidateInterface>(sql);
    }

    async findChainReclaimCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<ExistingTransferChainReclaimCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferChainReclaimCandidateInterface>(sql);
    }

    async findIncomeDuplicateCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferIncomeDuplicateCandidateInterface>(sql);
    }
}
