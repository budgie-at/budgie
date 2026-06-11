import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAtmCashWithdrawalReviewCandidatesSql
} from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    ConsolidationScanScopeInterface,
    DB
} from '@budgie/contracts';

export class AtmCashWithdrawalRepository {
    constructor(private db: DB) {}

    async findCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalCandidatesSql(scope);

        return this.db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(sql);
    }

    async findReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        const sql = buildAtmCashWithdrawalReviewCandidatesSql();

        return this.db.$client.getAllAsync<AtmCashWithdrawalReviewCandidateInterface>(sql);
    }
}
