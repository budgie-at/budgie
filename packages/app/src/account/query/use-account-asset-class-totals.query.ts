import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useAccountAssetClassTotalsQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getAssetClassTotals(defaultInstrument.id), dependencies);
    const result = data.at(0);
    const fiatTotal = useCachedMicroUnitQuery(result?.fiatTotal, dependencies);
    const cryptoTotal = useCachedMicroUnitQuery(result?.cryptoTotal, dependencies);

    return {
        fiatTotal,
        cryptoTotal,
        fiatCount: result?.fiatCount ?? 0,
        cryptoCount: result?.cryptoCount ?? 0
    };
};
