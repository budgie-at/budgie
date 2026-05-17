import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { StatisticsFilterInterface, TransactionFilterInterface } from '@budgie/contracts';

const buildTransactionFilter = (filters: StatisticsFilterInterface): TransactionFilterInterface => ({
    accountIds: null,
    categoryIds: filters.categoryIds,
    date: filters.date,
    tagIds: filters.tagIds,
    types: [filters.type]
});

export const useGetStatisticsTransactionsQuery = (filters: StatisticsFilterInterface) => {
    const filterKey = buildTransactionFilterKey(buildTransactionFilter(filters));
    const buildQuery = (limit: number) => statisticsRepository.getTransactions(filters, limit);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
