import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetByIdQuery = (id: number) => {
    const { data, error } = useLiveQuery(budgetRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: true, budget: null, error };
    }

    return {
        isLoading: false,
        budget: data,
        error
    };
};
