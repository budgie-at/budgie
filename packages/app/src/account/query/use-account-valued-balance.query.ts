import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useAccountValuedBalanceQuery = (accountId: number) => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [accountId, defaultInstrument.id, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getValuedByAccountId(accountId, defaultInstrument.id), dependencies);
    const result = data.at(0);
    const balance = useCachedMicroUnitQuery(result?.balance, dependencies);
    const valuedBalance = useCachedMicroUnitQuery(result?.valuedBalance, dependencies);

    return {
        balance,
        valuedBalance
    };
};
