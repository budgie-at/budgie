import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';

export const useAccountBalancesUpdatedAtQuery = () => {
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data } = useLiveQuery(accountBalanceRepository.getLatestUpdatedAt(), [databaseRefreshVersion]);

    return data.at(0)?.updatedAt;
};
