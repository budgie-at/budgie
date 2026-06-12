import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseChangeKey } from '../../@generic/hook/use-database-change-key.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const databaseChangeKey = useDatabaseChangeKey();
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.countUncategorized(filters), [filterKey, databaseChangeKey]);
    const row = data.at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;

    return {
        count: income + expense,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
