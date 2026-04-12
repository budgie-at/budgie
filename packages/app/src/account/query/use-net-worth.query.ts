import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), [defaultInstrument.id]);
    const netWorth = data.at(0)?.netWorth ?? 0;

    return convertFromMicroUnits(netWorth);
};
