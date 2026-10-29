import { BudgetSinkingFundRepository } from '@budgie/budget';
import { BudgetSinkingFundEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

interface UseGetBudgetFundsResult {
    readonly funds: readonly BudgetSinkingFundEntityInterface[];
    readonly isLoading: boolean;
}

const EMPTY_FUNDS: readonly BudgetSinkingFundEntityInterface[] = [];

export const budgetFundsAtom = databaseQueryFamily(
    [BudgetSinkingFundEntityTable],
    BudgetSinkingFundRepository,
    (budgetSinkingFundRepository, budgetId: number) => budgetSinkingFundRepository.getByBudget(budgetId)
);

export const useGetBudgetFundsQuery = (budgetId: number): UseGetBudgetFundsResult => {
    const result = useLiveAtomValue(budgetFundsAtom(budgetId));

    if (AsyncResult.isInitial(result)) {
        return { funds: EMPTY_FUNDS, isLoading: true };
    }

    return { funds: AsyncResult.getOrElse(result, () => EMPTY_FUNDS), isLoading: false };
};
