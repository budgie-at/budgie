import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetAllocationRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetAllocationsQuery = (budgetId: number) => {
    const { data, updatedAt, error } = useLiveQuery(budgetAllocationRepository.findByBudgetIdWithCategory(budgetId), [budgetId]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, allocations: [], error };
    }

    return {
        isLoading: false,
        allocations: data,
        error
    };
};
