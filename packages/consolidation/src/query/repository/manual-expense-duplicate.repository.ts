import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL } from './sql-factory/manual-expense-duplicate-candidate-sql.factory';

import type { ManualExpenseDuplicateCandidateInterface } from '../interface/manual-expense-duplicate-candidate.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class ManualExpenseDuplicateRepository extends Context.Service<ManualExpenseDuplicateRepository>()(
    '@budgie/consolidation/ManualExpenseDuplicateRepository',
    {
        make: Effect.succeed({
            findCandidates: (scope: ConsolidationScanScopeInterface | null = null) =>
                Db.query(db => db.$client.unsafe<ManualExpenseDuplicateCandidateInterface>(MANUAL_EXPENSE_DUPLICATE_CANDIDATES_SQL(scope)))
        })
    }
) {
    static readonly layer = Layer.effect(ManualExpenseDuplicateRepository, ManualExpenseDuplicateRepository.make);
}
