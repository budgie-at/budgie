import { statisticsRepository } from '../../@generic/drizzle/db/db';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { StatisticsFilterInterface } from '@budgie/contracts';

export const useGetStatisticsTransactionsQuery = (filters: StatisticsFilterInterface) => {
    const filterKey = JSON.stringify(filters);
    const buildQuery = (limit: number) => statisticsRepository.getTransactions(filters, limit);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
