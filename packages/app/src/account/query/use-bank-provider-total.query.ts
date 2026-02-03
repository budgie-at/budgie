import { ExternalSourceEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useBankProviderTotalQuery = (provider: ExternalSourceEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByBankProvider(defaultInstrument.id, provider), [
        defaultInstrument.id,
        provider
    ]);

    return convertFromMicroUnits(data.at(0)?.total ?? 0);
};
