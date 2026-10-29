import { BudgetLimitChangeRepository } from '@budgie/budget';
import { BudgetLimitChangeEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetLimitChangeEntityInterface } from '@budgie/contracts';

interface UseGetBudgetLimitChangesResult {
    readonly limitChanges: readonly BudgetLimitChangeEntityInterface[];
    readonly isLoading: boolean;
}

const LIMIT_CHANGE_HISTORY_SIZE = 50;
const EMPTY_LIMIT_CHANGES: readonly BudgetLimitChangeEntityInterface[] = [];

const budgetLimitChangesAtom = databaseQueryFamily(
    [BudgetLimitChangeEntityTable],
    BudgetLimitChangeRepository,
    (budgetLimitChangeRepository, budgetId: number) => budgetLimitChangeRepository.findByBudget(budgetId, LIMIT_CHANGE_HISTORY_SIZE)
);

export const useGetBudgetLimitChangesQuery = (budgetId: number): UseGetBudgetLimitChangesResult => {
    const result = useLiveAtomValue(budgetLimitChangesAtom(budgetId));

    if (AsyncResult.isInitial(result)) {
        return { limitChanges: EMPTY_LIMIT_CHANGES, isLoading: true };
    }

    return { limitChanges: AsyncResult.getOrElse(result, () => EMPTY_LIMIT_CHANGES), isLoading: false };
};
