import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from './sql-factory/transfer-pair-candidate-sql.factory';
import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAtmCashWithdrawalReviewCandidatesSql
} from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';
import { EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-bridge-sql.factory';
import { EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-chain-reclaim-sql.factory';
import { EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-existing-transfer-income-duplicate-sql.factory';
import { IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-canonical-duplicate-sql.factory';
import { IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-chain-sql.factory';
import { IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL } from './sql-factory/transfer-pair-iban-bridge-transfer-sql.factory';

import type { DB } from '../../@generic/type/db.type';
import type { AtmCashWithdrawalCandidateInterface } from '../interface/atm-cash-withdrawal-candidate.interface';
import type { AtmCashWithdrawalReviewCandidateInterface } from '../interface/atm-cash-withdrawal-review-candidate.interface';
import type { ConsolidationScanScopeInterface } from '../interface/consolidation-scan-scope.interface';
import type { ExistingTransferBridgeCandidateInterface } from '../interface/existing-transfer-bridge-candidate.interface';
import type { ExistingTransferChainReclaimCandidateInterface } from '../interface/existing-transfer-chain-reclaim-candidate.interface';
import type { ExistingTransferIncomeDuplicateCandidateInterface } from '../interface/existing-transfer-income-duplicate-candidate.interface';
import type { IbanBridgeCanonicalDuplicateCandidateInterface } from '../interface/iban-bridge-canonical-duplicate-candidate.interface';
import type { IbanBridgeChainTransferCandidateInterface } from '../interface/iban-bridge-chain-transfer-candidate.interface';
import type { IbanBridgeTransferCandidateInterface } from '../interface/iban-bridge-transfer-candidate.interface';
import type { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';
import type { TransferPairReviewCandidateInterface } from '../interface/transfer-pair-review-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    async findCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<TransferPairCandidateInterface[]> {
        const sql = buildTransferPairCandidatesSql(scope);

        return this.db.$client.getAllAsync<TransferPairCandidateInterface>(sql);
    }

    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }

    async findAtmCashWithdrawalCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalCandidatesSql(scope);

        return this.db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(sql);
    }

    async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalReviewCandidatesSql();

        return this.db.$client.getAllAsync<AtmCashWithdrawalReviewCandidateInterface>(sql);
    }

    async findExistingTransferBridgeCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<ExistingTransferBridgeCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferBridgeCandidateInterface>(sql);
    }

    async findExistingTransferChainReclaimCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<ExistingTransferChainReclaimCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_CHAIN_RECLAIM_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferChainReclaimCandidateInterface>(sql);
    }

    async findExistingTransferIncomeDuplicateCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        const sql = EXISTING_TRANSFER_INCOME_DUPLICATE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<ExistingTransferIncomeDuplicateCandidateInterface>(sql);
    }

    async findIbanBridgeTransferCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_TRANSFER_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeTransferCandidateInterface>(sql);
    }

    async findIbanBridgeCanonicalDuplicateCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeCanonicalDuplicateCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CANONICAL_DUPLICATE_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeCanonicalDuplicateCandidateInterface>(sql);
    }

    async findIbanBridgeChainTransferCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        const sql = IBAN_BRIDGE_CHAIN_TRANSFER_CANDIDATES_SQL(scope);

        return this.db.$client.getAllAsync<IbanBridgeChainTransferCandidateInterface>(sql);
    }
}
