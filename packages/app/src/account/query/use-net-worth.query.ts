import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), [defaultInstrument.id]);

    const [netWorthState, setNetWorthState] = useState(data.at(0)?.netWorth ?? BigInt(0));

    // HINT: temporary fix to force refresh on screen focus
    useFocusEffect(
        useCallback(() => {
            accountBalanceRepository
                .getNetWorth(defaultInstrument.id)
                .execute()
                .then(([{ netWorth }]) => void setNetWorthState(netWorth))
                .catch(() => void setNetWorthState(BigInt(0)));
        }, [data])
    );

    return netWorthState;
};
