import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useExchangeRatesUpdatedAtQuery } from '../../exchange-rate/query/use-exchange-rates-updated-at.query';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useAccountAssetClassTotalsQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const exchangeRatesUpdatedAt = useExchangeRatesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, accountBalancesUpdatedAt, exchangeRatesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getAssetClassTotals(defaultInstrument.id), dependencies);
    const result = data.at(0);
    const fiatTotal = useCachedMicroUnitQuery(result?.fiatTotal, dependencies);
    const cryptoTotal = useCachedMicroUnitQuery(result?.cryptoTotal, dependencies);

    return {
        fiatTotal,
        cryptoTotal,
        fiatCount: isDefined(result?.fiatCount) ? result.fiatCount : 0,
        cryptoCount: isDefined(result?.cryptoCount) ? result.cryptoCount : 0
    };
};
