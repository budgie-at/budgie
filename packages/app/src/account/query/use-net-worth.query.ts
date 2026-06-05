import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const defaultInstrumentId = defaultInstrument.id;
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const queryDependencies = [defaultInstrumentId, accountBalancesUpdatedAt, exchangeRatesUpdatedAt];
    const query = accountBalanceRepository.getNetWorth(defaultInstrumentId);
    const { data } = useLiveQuery(query, queryDependencies);

    return useCachedMicroUnitQuery(data.at(0)?.netWorth);
};
