import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/drizzle/hook/use-database-live-query.hook';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

type BalanceQuery =
    | ReturnType<typeof accountBalanceRepository.getByAccountId>
    | ReturnType<typeof accountBalanceRepository.getArchivedAccountBalance>
    | ReturnType<typeof accountBalanceRepository.getTotalByCryptoInstrument>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const { data } = useDatabaseLiveQuery(query, [...dependencies, accountBalancesUpdatedAt]);
    const balance = useCachedMicroUnitQuery(data.at(0)?.balance);

    return { balance };
};
