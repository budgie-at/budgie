import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { exchangeRateRepository } from '../../@generic/drizzle/db/db';

export const useExchangeRatesUpdatedAtQuery = () => {
    const { data } = useLiveQuery(exchangeRateRepository.getLatestUpdatedAt(), []);

    return data.at(0)?.updatedAt;
};
