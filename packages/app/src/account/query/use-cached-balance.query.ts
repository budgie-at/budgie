import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

type BalanceQuery =
    | ReturnType<typeof accountBalanceRepository.getByAccountId>
    | ReturnType<typeof accountBalanceRepository.getArchivedAccountBalance>
    | ReturnType<typeof accountBalanceRepository.getTotalByCryptoInstrument>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const queryDependencies = [...dependencies, accountBalancesUpdatedAt];
    const { data } = useDatabaseLiveQuery(query, queryDependencies);
    const balance = useCachedMicroUnitQuery(data.at(0)?.balance);

    return { balance };
};
