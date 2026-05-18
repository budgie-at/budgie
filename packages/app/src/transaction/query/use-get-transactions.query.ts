import { transactionRepository } from '../../@generic/drizzle/db/db';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const filterKey = buildTransactionFilterKey(filters);
    const buildQuery = (limit: number) => transactionRepository.getAll(limit, filters);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
