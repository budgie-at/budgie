import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetCategoryLimitRepository } from '../../@generic/drizzle/db/db';

import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

interface UseGetBudgetCategoryLimitsResult {
    readonly categoryLimits: readonly BudgetCategoryLimitEntityInterface[];
    readonly isLoading: boolean;
}

const EMPTY_LIMITS: readonly BudgetCategoryLimitEntityInterface[] = [];

export const useGetBudgetCategoryLimitsQuery = (budgetId: number | null): UseGetBudgetCategoryLimitsResult => {
    const lookupId = budgetId ?? 0;
    const { data, updatedAt } = useLiveQuery(budgetCategoryLimitRepository.findByBudget(lookupId), [lookupId]);

    if (!isDefined(budgetId) || !isDefined(updatedAt)) {
        return { categoryLimits: EMPTY_LIMITS, isLoading: true };
    }

    return { categoryLimits: data, isLoading: false };
};
