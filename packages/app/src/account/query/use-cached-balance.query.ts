import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

type BalanceQuery =
    | ReturnType<typeof accountBalanceRepository.getByAccountId>
    | ReturnType<typeof accountBalanceRepository.getArchivedAccountBalance>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const queryDependencies = [...dependencies, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(query, queryDependencies);
    const rows = data ?? [];
    const balance = useCachedMicroUnitQuery(rows.at(0)?.balance, queryDependencies);

    return { balance };
};
