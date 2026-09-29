import { buildAtmCashWithdrawalCandidatesSql } from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type { AtmCashWithdrawalCandidateInterface, ConsolidationScanScopeInterface, DB } from '@budgie/contracts';

export class AtmCashWithdrawalRepository {
    constructor(private db: DB) {}

    async findCandidates(scope: ConsolidationScanScopeInterface | null = null): Promise<AtmCashWithdrawalCandidateInterface[]> {
        return this.db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(scope));
    }
}
