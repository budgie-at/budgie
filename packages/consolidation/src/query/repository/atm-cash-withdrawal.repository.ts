import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { buildAtmCashWithdrawalCandidatesSql } from './sql-factory/transfer-pair-cash-withdrawal-sql.factory';

import type { AtmCashWithdrawalCandidateInterface, ConsolidationScanScopeInterface } from '@budgie/contracts';

export class AtmCashWithdrawalRepository extends Context.Service<AtmCashWithdrawalRepository>()(
    '@budgie/consolidation/AtmCashWithdrawalRepository',
    {
        make: Effect.succeed({
            findCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db => db.$client.unsafe<AtmCashWithdrawalCandidateInterface>(buildAtmCashWithdrawalCandidatesSql(scope)))
        })
    }
) {
    static readonly layer = Layer.effect(AtmCashWithdrawalRepository, AtmCashWithdrawalRepository.make);
}
