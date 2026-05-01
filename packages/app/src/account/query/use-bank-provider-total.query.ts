import { ExternalSourceEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useBankProviderTotalQuery = (provider: ExternalSourceEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByBankProvider(defaultInstrument.id, provider), [
        defaultInstrument.id,
        provider
    ]);
    const total = useCachedMicroUnitQuery(data.at(0)?.total, [defaultInstrument.id, provider]);

    return total;
};
