import { exchangeRateRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useExchangeRatesUpdatedAtQuery = () => {
    const { data } = useDatabaseLiveQuery(exchangeRateRepository.getLatestUpdatedAt(), []);

    return data.at(0)?.updatedAt;
};
