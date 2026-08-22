import { TransactionFilterInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';

export const useGetTransactionCountQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const filterKey = buildTransactionFilterKey(filters);
    const { data, error, updatedAt } = useDatabaseLiveQuery(transactionRepository.countAll(filters, defaultInstrument.id), [
        filterKey,
        defaultInstrument.id
    ]);

    return {
        count: data.at(0)?.value ?? 0,
        error: error ?? null,
        isLoading: !isDefined(updatedAt)
    };
};
