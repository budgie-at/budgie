import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseChangeKey } from '../../@generic/hook/use-database-change-key.hook';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

type BalanceQuery =
    | ReturnType<typeof accountBalanceRepository.getByAccountId>
    | ReturnType<typeof accountBalanceRepository.getArchivedAccountBalance>
    | ReturnType<typeof accountBalanceRepository.getTotalByCryptoInstrument>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const databaseChangeKey = useDatabaseChangeKey();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const queryDependencies = [...dependencies, accountBalancesUpdatedAt, databaseChangeKey];
    const { data } = useLiveQuery(query, queryDependencies);
    const balance = useCachedMicroUnitQuery(data.at(0)?.balance);

    return { balance };
};
