import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { buildAtmCashWithdrawalCandidatesSql } from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type { AtmCashWithdrawalCandidateInterface, ConsolidationScanScopeInterface } from '@budgie/contracts';

export class AtmCashWithdrawalRepository {
    readonly findCandidates = Effect.fn('AtmCashWithdrawalRepository.findCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        return yield* Db.query(db =>
            db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(scope))
        );
    });
}
