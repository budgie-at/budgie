import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetTransactionByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(transactionRepository.findById(id), [id]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, transaction: null, updatedAt: null, error };
    }

    return { transaction: data, isLoading: false, updatedAt, error };
};
