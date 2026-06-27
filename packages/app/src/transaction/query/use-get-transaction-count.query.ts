import { TransactionFilterInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useDatabaseLiveQuery(transactionRepository.countAll(filters), [filterKey]);

    return {
        count: data.at(0)?.value ?? 0,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
