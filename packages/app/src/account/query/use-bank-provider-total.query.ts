import { ExternalSourceEnum } from '@budgie/contracts';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useAccountBalancesUpdatedAtQuery } from './use-account-balances-updated-at.query';
import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useBankProviderTotalQuery = (provider: ExternalSourceEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const accountBalancesUpdatedAt = useAccountBalancesUpdatedAtQuery();
    const dependencies = [defaultInstrument.id, provider, accountBalancesUpdatedAt];
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByBankProvider(defaultInstrument.id, provider), dependencies);
    const rows = data ?? [];
    const total = useCachedMicroUnitQuery(rows.at(0)?.total, dependencies);

    return total;
};
