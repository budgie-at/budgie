import { isDefined } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/drizzle/hook/use-database-live-query.hook';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetActiveBudgetResult {
    readonly budget: BudgetEntityInterface | null;
    readonly isLoading: boolean;
}

export const useGetActiveBudgetQuery = (): UseGetActiveBudgetResult => {
    const { data, updatedAt } = useDatabaseLiveQuery(budgetRepository.findActive());

    if (!isDefined(updatedAt)) {
        return { budget: null, isLoading: true };
    }

    return { budget: isDefined(data) ? data : null, isLoading: false };
};
