import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetTransactionByIdQuery = (id: number) => {
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getById(id), [id]);

    return isDefined(updatedAt)
        ? { transaction: data, isLoading: false, error: error ?? null }
        : { transaction: null, isLoading: true, error: null };
};
