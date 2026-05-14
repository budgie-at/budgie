import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetActiveBudgetResult {
    readonly budget: BudgetEntityInterface | null;
    readonly isLoading: boolean;
}

export const useGetActiveBudgetQuery = (): UseGetActiveBudgetResult => {
    const { data, updatedAt } = useLiveQuery(budgetRepository.findActive());

    if (!isDefined(updatedAt)) {
        return { budget: null, isLoading: true };
    }

    return { budget: data ?? null, isLoading: false };
};
