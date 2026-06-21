import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const filterKey = buildTransactionFilterKey(filters);
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.countUncategorized(filters), [filterKey, databaseRefreshVersion]);
    const row = data.at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;

    return {
        count: income + expense,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
