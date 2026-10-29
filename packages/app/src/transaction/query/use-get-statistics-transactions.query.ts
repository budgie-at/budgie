import { StatisticsRepository } from '@budgie/contracts';
import * as Option from 'effect/Option';

import { isDefined } from '@rnw-community/shared';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { LanguageEnum, StatisticsFilterInterface, TransactionFilterInterface } from '@budgie/contracts';

const buildTransactionFilter = (filters: StatisticsFilterInterface): TransactionFilterInterface => ({
    accountIds: filters.accountIds,
    categoryIds: filters.categoryIds,
    date: filters.date,
    amount: filters.amount,
    tagIds: filters.tagIds,
    types: isDefined(filters.type) ? [filters.type] : null
});

export const statisticsTransactionsAtom = databaseQueryFamily(
    TRANSACTION_LIST_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, language, limit]: readonly [StatisticsFilterInterface, LanguageEnum, number]) =>
        statisticsRepository.getTransactions(filters, limit, language)
);

export const useGetStatisticsTransactionsQuery = (filters: StatisticsFilterInterface) => {
    const excludedCategoryKey = filters.excludedCategoryIds?.join(',') ?? 'null';
    const filterKey = `${buildTransactionFilterKey(buildTransactionFilter(filters))}|${excludedCategoryKey}`;

    return useGetTransactionSectionsQuery(
        (limit, language) => statisticsTransactionsAtom([filters, language, limit]),
        filterKey,
        Option.none()
    );
};
