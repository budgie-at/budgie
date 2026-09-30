import { BudgetCategoryLimitRepository } from '@budgie/budget';
import { BudgetCategoryLimitEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

interface UseGetBudgetCategoryLimitsResult {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly isLoading: boolean;
}

const EMPTY_LIMITS: readonly BudgetCategoryLimitEntityInterface[] = [];

const budgetCategoryLimitsAtom = databaseQueryFamily(
    [BudgetCategoryLimitEntityTable],
    BudgetCategoryLimitRepository,
    (budgetCategoryLimitRepository, budgetId: number) => budgetCategoryLimitRepository.getByBudget(budgetId)
);

export const useGetBudgetCategoryLimitsQuery = (budgetId: number | null): UseGetBudgetCategoryLimitsResult => {
    const result = useLiveAtomValue(budgetCategoryLimitsAtom(budgetId ?? 0));

    if (!isDefined(budgetId) || AsyncResult.isInitial(result)) {
        return { categoryLimits: EMPTY_LIMITS, isLoading: true };
    }

    return { categoryLimits: AsyncResult.getOrElse(result, () => EMPTY_LIMITS), isLoading: false };
};
