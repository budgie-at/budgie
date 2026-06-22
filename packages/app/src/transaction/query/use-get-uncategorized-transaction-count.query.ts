import { TransactionFilterInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetUncategorizedTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useDatabaseLiveQuery(transactionRepository.countUncategorized(filters), [filterKey]);
    const row = data.at(0);
    const income = row?.income ?? 0;
    const expense = row?.expense ?? 0;

    return {
        count: income + expense,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
