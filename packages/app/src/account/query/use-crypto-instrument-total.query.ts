import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useCryptoInstrumentTotalQuery = (instrumentId: number) => {
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [instrumentId, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByCryptoInstrument(instrumentId), dependencies);

    return useCachedMicroUnitQuery(data.at(0)?.balance);
};
