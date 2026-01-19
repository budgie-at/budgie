import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

export const useGetActiveBudgetQuery = () => {
    const { data, error, updatedAt } = useLiveQuery(budgetRepository.findActive());

    return isDefined(updatedAt) ? { budget: data, isLoading: false, error: error ?? null } : { budget: null, isLoading: true, error: null };
};
