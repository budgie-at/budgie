import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(budgetRepository.findAll(), []);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, budgets: [], error };
    }

    return {
        isLoading: false,
        budgets: data,
        error
    };
};
