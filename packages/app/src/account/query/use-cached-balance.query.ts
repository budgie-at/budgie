import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

type BalanceQuery = ReturnType<typeof accountBalanceRepository.getByAccountId>;

export const useCachedBalanceQuery = (query: BalanceQuery, dependencies: unknown[]) => {
    const { data } = useLiveQuery(query, dependencies);
    const balance = useCachedMicroUnitQuery(data.at(0)?.balance, dependencies);

    return { balance };
};
