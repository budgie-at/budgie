import { buildP2pFiatAtomicCandidateSql } from './sql-factory/p2p-fiat-atomic-candidate-sql.factory';
import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from './sql-factory/transfer-pair-candidate-sql.factory';

import type { P2pFiatAtomicCandidateInterface } from '../interface/p2p-fiat-atomic-candidate.interface';
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

    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }
}
