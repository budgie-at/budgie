import { TransactionCategoryFilterModeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const useUncategorizedCountQuery = (filters: TransactionFilterInterface) => {
    const uncategorizedFilters = {
        ...filters,
        categoryMode: TransactionCategoryFilterModeEnum.UNCATEGORIZED,
        categoryIds: null
    };
    const filterKey = buildTransactionFilterKey(uncategorizedFilters);
    const { data } = useLiveQuery(transactionRepository.countUncategorized(uncategorizedFilters), [filterKey]);

    return { count: data[0]?.value ?? 0 };
};
