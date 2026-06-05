import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

export const useAccountBalancesUpdatedAtQuery = () => {
    const { updatedAt } = useLiveQuery(accountBalanceRepository.getLatestUpdatedAt(), []);

    return updatedAt;
};
