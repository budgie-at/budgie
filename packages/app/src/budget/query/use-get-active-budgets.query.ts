import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetActiveBudgetsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(budgetRepository.findActive(), []);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, budgets: [], error };
    }

    return {
        isLoading: false,
        budgets: data,
        error
    };
};

