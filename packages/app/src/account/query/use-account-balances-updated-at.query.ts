import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useAccountBalancesUpdatedAtQuery = () => {
    const { data } = useDatabaseLiveQuery(accountBalanceRepository.getLatestUpdatedAt());

    return data.at(0)?.updatedAt;
};
