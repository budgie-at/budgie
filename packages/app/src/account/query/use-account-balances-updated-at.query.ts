import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

export const useAccountBalancesUpdatedAtQuery = () => {
    const { data } = useLiveQuery(accountBalanceRepository.getLatestUpdatedAt(), []);

    return data.at(0)?.updatedAt;
};
