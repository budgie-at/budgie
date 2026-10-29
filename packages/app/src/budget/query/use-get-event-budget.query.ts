import { BudgetRepository } from '@budgie/budget';
import { BudgetEntityTable } from '@budgie/contracts';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { resolveBudgetQueryResult } from '../utils/resolve-budget-query-result.util';

import type { BudgetQueryResultInterface } from '../interface/budget-query-result.interface';

export const eventBudgetAtom = databaseQueryFamily([BudgetEntityTable], BudgetRepository, (budgetRepository, id: number) =>
    budgetRepository.findEvent(id)
);

export const useGetEventBudgetQuery = (id: number): BudgetQueryResultInterface =>
    resolveBudgetQueryResult(useLiveAtomValue(eventBudgetAtom(id)));
