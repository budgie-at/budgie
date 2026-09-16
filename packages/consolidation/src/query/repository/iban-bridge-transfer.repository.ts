import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-supersession-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type {
    ConsolidationScanScopeInterface,
    DB,
    IbanBridgeCanonicalDuplicateCandidateInterface,
    IbanBridgeCanonicalSupersessionCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface
} from '@budgie/contracts';

export class IbanBridgeTransferRepository {
    constructor(private db: DB) {}

    async findTransferCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<IbanBridgeTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeTransferCandidateInterface>(sql);
    }

    async findCanonicalDuplicateCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeCanonicalDuplicateCandidateInterface>(sql);
    }

    async findCanonicalSupersessionCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeCanonicalSupersessionCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CANONICAL_SUPERSESSION_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeCanonicalSupersessionCandidateInterface>(sql);
    }

    async findChainTransferCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeChainTransferCandidateInterface>(sql);
    }
}
