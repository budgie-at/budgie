import { buildP2pFiatAtomicCandidateSql } from './sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import { buildP2pFiatAuthoritativeCandidateSql } from './sql-factory/p2p-fiat-authoritative-candidate-sql.factory';
import { buildP2pFiatAuthoritativeRepairCandidateSql } from './sql-factory/p2p-fiat-authoritative-repair-candidate-sql.factory';
import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from './sql-factory/transfer-pair-candidate-sql.factory';

import type { P2pFiatAtomicCandidateInterface } from '../interface/p2p-fiat-atomic-candidate.interface';
import type { P2pFiatAuthoritativeCandidateInterface } from '../interface/p2p-fiat-authoritative-candidate.interface';
import type { P2pFiatAuthoritativeRepairCandidateInterface } from '../interface/p2p-fiat-authoritative-repair-candidate.interface';
import type {
    ConsolidationScanScopeInterface,
    DB,
    TransferPairCandidateInterface,
    TransferPairReviewCandidateInterface
} from '@budgie/contracts';

export class TransferPairRepository {
    constructor(private db: DB) {}

    async findCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<TransferPairCandidateInterface[]> {
        const sql = buildTransferPairCandidatesSql(scope);

        return this.db.$client.getAllAsync<TransferPairCandidateInterface>(sql);
    }

    async findP2pFiatAtomicCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<P2pFiatAtomicCandidateInterface[]> {
        const sql = buildP2pFiatAtomicCandidateSql(scope);

        return this.db.$client.getAllAsync<P2pFiatAtomicCandidateInterface>(sql);
    }

    async findP2pFiatAuthoritativeCandidates(
        scope: ConsolidationScanScopeInterface | null = null
    ): Promise<P2pFiatAuthoritativeCandidateInterface[]> {
        return this.db.$client.getAllAsync<P2pFiatAuthoritativeCandidateInterface>(buildP2pFiatAuthoritativeCandidateSql(scope));
    }

    async findP2pFiatAuthoritativeRepairCandidates(): Promise<P2pFiatAuthoritativeRepairCandidateInterface[]> {
        return this.db.$client.getAllAsync<P2pFiatAuthoritativeRepairCandidateInterface>(buildP2pFiatAuthoritativeRepairCandidateSql());
    }

    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }
}
