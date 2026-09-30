import { Db } from '@budgie/contracts';

import { buildAtmCashWithdrawalCandidatesSql } from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type { AtmCashWithdrawalCandidateInterface, ConsolidationScanScopeInterface } from '@budgie/contracts';

export class AtmCashWithdrawalRepository {
    readonly findCandidates = (scope: ConsolidationScanScopeInterface | null = null) =>
        Db.query(db => db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(scope)));
}
