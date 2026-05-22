import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), dependencies);
    const rows = data ?? [];
    const netWorth = useCachedMicroUnitQuery(rows.at(0)?.netWorth, dependencies);

    return netWorth;
};
