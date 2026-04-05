import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getNetWorth(defaultInstrument.id), [defaultInstrument.id]);
    const previousValueRef = useRef(0);

    const netWorth = data.at(0)?.netWorth;

    if (isDefined(netWorth)) {
        previousValueRef.current = convertFromMicroUnits(netWorth);
    }

    return previousValueRef.current;
};
