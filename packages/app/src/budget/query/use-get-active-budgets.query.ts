import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetActiveBudgetQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(budgetRepository.findActive(), []);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, budget: null, error };
    }

    return {
        isLoading: false,
        budget: data ?? null,
        error
    };
};

