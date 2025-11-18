import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountRepository.getNetWorth(defaultInstrument.id));
    const { total } = data.at(0) ?? { total: 0 };

    return total;
};
