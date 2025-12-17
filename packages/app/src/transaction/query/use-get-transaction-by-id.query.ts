import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

export const useGetTransactionByIdQuery = (id: number) => {
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getById(id), [id]);

    return isDefined(updatedAt)
        ? { transaction: data, isLoading: false, error: error ?? null }
        : { transaction: null, isLoading: true, error: null };
};
