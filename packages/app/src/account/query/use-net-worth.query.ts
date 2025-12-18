import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), [defaultInstrument.id]);

    const [netWorthState, setNetWorthState] = useState<number>(data.at(0)?.netWorth ?? 0);

    // HINT: temporary fix to force refresh on screen focus
    useFocusEffect(
        // eslint-disable-next-line react-hooks/preserve-manual-memoization
        useCallback(() => {
            accountBalanceRepository
                .getNetWorth(defaultInstrument.id)
                .execute()
                .then(([{ netWorth }]) => void setNetWorthState(netWorth))
                .catch(() => {
                    setNetWorthState(0);
                });
        }, [data])
    );

    return netWorthState;
};
