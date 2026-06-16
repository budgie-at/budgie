import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/drizzle/hook/use-database-live-query.hook';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const defaultInstrumentId = defaultInstrument.id;
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const { data } = useDatabaseLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrumentId), [
        defaultInstrumentId,
        accountBalancesUpdatedAt,
        exchangeRatesUpdatedAt
    ]);

    return useCachedMicroUnitQuery(data.at(0)?.netWorth);
};
