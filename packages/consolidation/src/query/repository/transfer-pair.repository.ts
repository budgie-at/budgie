import {
    buildTransferPairCandidatesSql,
    buildTransferPairManualReviewCandidatesSql
} from '../sql-factory/transfer-pair-candidate-sql.factory';

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

    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = buildTransferPairManualReviewCandidatesSql();

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }
}
