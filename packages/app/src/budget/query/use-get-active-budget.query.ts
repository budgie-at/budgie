import { BudgetRepository } from '@budgie/budget';
import { BudgetEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { resolveBudgetQueryResult } from '../utils/resolve-budget-query-result.util';

import type { BudgetQueryResultInterface } from '../interface/budget-query-result.interface';

export const activeBudgetAtom = databaseQueryAtom(
    [BudgetEntityTable],
    Effect.flatMap(BudgetRepository, budgetRepository => budgetRepository.findMain())
);

export const useGetActiveBudgetQuery = (): BudgetQueryResultInterface => resolveBudgetQueryResult(useLiveAtomValue(activeBudgetAtom));
