import { AccountDebtTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useDebtTypeTotalQuery = (debtType: AccountDebtTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByDebtType(defaultInstrument.id, debtType), [
        defaultInstrument.id,
        debtType
    ]);

    return convertFromMicroUnits(data.at(0)?.total ?? 0);
};
