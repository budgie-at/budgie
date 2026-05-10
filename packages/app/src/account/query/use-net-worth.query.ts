import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), dependencies);
    const netWorth = useCachedMicroUnitQuery(data.at(0)?.netWorth, dependencies);

    return netWorth;
};
