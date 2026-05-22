import { TransactionFilterInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useLiveQuery(transactionRepository.countUncategorized(filters), [filterKey]);
    const rows = data ?? [];
    const row = rows.at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;

    return {
        count: income + expense,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
