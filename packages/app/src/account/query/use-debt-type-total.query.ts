import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useDebtTypeTotalQuery = (debtType: AccountDebtTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, debtType, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getTotalRemainingDebtByType(defaultInstrument.id, debtType), dependencies);
    const total = useCachedMicroUnitQuery(data.at(0)?.total, dependencies);

    return total;
};
