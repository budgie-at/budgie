import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import {
    buildAtmCashWithdrawalCandidatesSql,
    buildAtmCashWithdrawalReviewCandidatesSql
} from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type {
    AtmCashWithdrawalCandidateInterface,
    AtmCashWithdrawalReviewCandidateInterface,
    ConsolidationScanScopeInterface
} from '@budgie/contracts';

export class AtmCashWithdrawalRepository {
    readonly findCandidates = Effect.fn('AtmCashWithdrawalRepository.findCandidates')(function* (
        scope: ConsolidationScanScopeInterface | null = null
    ) {
        const sql = buildAtmCashWithdrawalCandidatesSql(scope);

        return yield* Db.query(db => db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(sql));
    });

    readonly findReviewCandidates = Effect.fn('AtmCashWithdrawalRepository.findReviewCandidates')(function* () {
        const sql = buildAtmCashWithdrawalReviewCandidatesSql();

        return yield* Db.query(db => db.$client.getAllAsync<AtmCashWithdrawalReviewCandidateInterface>(sql));
    });
}
