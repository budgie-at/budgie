import { TransactionEntityTable, YieldRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

export const hasYieldAtom = databaseQueryAtom(
    [TransactionEntityTable],
    Effect.flatMap(YieldRepository, repository => repository.hasYield)
);
