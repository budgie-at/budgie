import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const defaultInstrumentId = defaultInstrument.id;
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const queryDependencies = [defaultInstrumentId, accountBalancesUpdatedAt, exchangeRatesUpdatedAt, databaseRefreshVersion];
    const query = accountBalanceRepository.getNetWorth(defaultInstrumentId);
    const { data } = useLiveQuery(query, queryDependencies);

    return useCachedMicroUnitQuery(data.at(0)?.netWorth);
};
