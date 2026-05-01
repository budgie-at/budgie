import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useDebtTypeTotalQuery = (debtType: AccountDebtTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalRemainingDebtByType(defaultInstrument.id, debtType), [
        defaultInstrument.id,
        debtType
    ]);
    const total = useCachedMicroUnitQuery(data.at(0)?.total, [defaultInstrument.id, debtType]);

    return total;
};
