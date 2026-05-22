import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useAccountBalancesUpdatedAtQuery = () => {
    const { updatedAt } = useLiveQuery(accountBalanceRepository.getAllBalances(), []);

    return updatedAt;
};
