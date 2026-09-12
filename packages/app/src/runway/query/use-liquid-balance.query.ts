import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useAccountBalancesUpdatedAtQuery } from '../../account/query/use-account-balances-updated-at.query';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useLiquidBalanceQuery = (): number => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const { data } = useDatabaseLiveQuery(accountBalanceRepository.getLiquidTotal(defaultInstrument.id), [
        defaultInstrument.id,
        accountBalancesUpdatedAt,
        exchangeRatesUpdatedAt
    ]);

    return data.at(0)?.total ?? 0;
};
