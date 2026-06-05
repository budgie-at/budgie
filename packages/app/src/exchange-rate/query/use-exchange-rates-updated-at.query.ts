import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { exchangeRateRepository } from '../../@generic/drizzle/db/db';

export const useExchangeRatesUpdatedAtQuery = () => {
    const { updatedAt } = useLiveQuery(exchangeRateRepository.getLatestUpdatedAt(), []);

    return updatedAt;
};
