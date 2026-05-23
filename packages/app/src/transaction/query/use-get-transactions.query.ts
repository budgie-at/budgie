import { DEFAULT_TRANSACTION_FILTER } from '@budgie/contracts';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

import { useGetTransactionSectionsQuery } from './use-get-transaction-sections.query';

import type { TransactionFilterInterface } from '@budgie/contracts';

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const language = useSetting('language');
    const filterKey = `${buildTransactionFilterKey(filters)}|${language}`;
    const buildQuery = (limit: number) => transactionRepository.getAll(limit, filters ?? DEFAULT_TRANSACTION_FILTER, language);

    return useGetTransactionSectionsQuery(buildQuery, filterKey);
};
