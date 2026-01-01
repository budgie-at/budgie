import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetAllocationInstanceRepository } from '../../@generic/drizzle/db/db';

export const useGetBudgetAllocationInstancesQuery = (budgetInstanceId: number) => {
    const { data, updatedAt, error } = useLiveQuery(
        budgetAllocationInstanceRepository.findByBudgetInstanceIdWithRelations(budgetInstanceId),
        [budgetInstanceId]
    );

    if (!isDefined(updatedAt)) {
        return { isLoading: true, allocationInstances: [], error };
    }

    return {
        isLoading: false,
        allocationInstances: data,
        error
    };
};

