import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseChangeKey } from '../../@generic/hook/use-database-change-key.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const databaseChangeKey = useDatabaseChangeKey();
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.countAll(filters), [filterKey, databaseChangeKey]);

    return {
        count: data.at(0)?.value ?? 0,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
