import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useDebtTypeTotalQuery = (debtType: AccountDebtTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalRemainingDebtByType(defaultInstrument.id, debtType), [
        defaultInstrument.id,
        debtType
    ]);
    const previousTotalRef = useRef(0);
    const previousDependenciesRef = useRef([defaultInstrument.id, debtType]);

    const total = data.at(0)?.total;
    const haveDependenciesChanged =
        defaultInstrument.id !== previousDependenciesRef.current[0] || debtType !== previousDependenciesRef.current[1];

    if (isDefined(total)) {
        previousTotalRef.current = convertFromMicroUnits(total);
    } else if (haveDependenciesChanged) {
        previousTotalRef.current = 0;
    }

    previousDependenciesRef.current = [defaultInstrument.id, debtType];

    return previousTotalRef.current;
};
