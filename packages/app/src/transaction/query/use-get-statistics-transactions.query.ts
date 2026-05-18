import { isDefined } from '@rnw-community/shared';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { StatisticsFilterInterface, TransactionFilterInterface } from '@budgie/contracts';

const buildTransactionFilter = (filters: StatisticsFilterInterface): TransactionFilterInterface => ({
    accountIds: null,
    categoryIds: filters.categoryIds,
    date: filters.date,
    tagIds: filters.tagIds,
    types: isDefined(filters.type) ? [filters.type] : null
});

export const useGetStatisticsTransactionsQuery = (filters: StatisticsFilterInterface) => {
    const language = useSetting('language');
    const filterKey = `${buildTransactionFilterKey(buildTransactionFilter(filters))}|${language}`;
    const buildQuery = (limit: number) => statisticsRepository.getTransactions(filters, limit, language);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
