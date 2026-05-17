import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const queryFilters = isDefined(filters.categoryIds) ? { ...filters, types: [] } : filters;
    const filterKey = buildTransactionFilterKey(queryFilters);
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.countUncategorized(queryFilters), [filterKey]);
    const row = data.at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;
    const types = [
        ...(isPositiveNumber(income) ? [TransactionTypeEnum.INCOME] : []),
        ...(isPositiveNumber(expense) ? [TransactionTypeEnum.EXPENSE] : [])
    ];

    return {
        count: income + expense,
        types,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
