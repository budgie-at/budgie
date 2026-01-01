import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { budgetAllocationRepository } from '../../@generic/drizzle/db/db';

export const useGetAllocationByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(budgetAllocationRepository.findById(id), [id]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, allocation: null, error };
    }

    return {
        isLoading: false,
        allocation: data,
        error
    };
};

