import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetInstanceRepository } from '../../@generic/drizzle/db/db';

export const useGetCurrentBudgetInstanceQuery = (budgetId: number) => {
    const { data, updatedAt, error } = useLiveQuery(budgetInstanceRepository.findCurrentByBudgetId(budgetId), [budgetId]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, instance: null, error };
    }

    return {
        isLoading: false,
        instance: data,
        error
    };
};

