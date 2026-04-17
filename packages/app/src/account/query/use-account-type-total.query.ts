import { AccountTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountBalanceRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const useAccountTypeTotalQuery = (accountType: AccountTypeEnum) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(accountBalanceRepository.getTotalByAccountType(defaultInstrument.id, accountType), [
        defaultInstrument.id,
        accountType
    ]);
    const total = useCachedMicroUnitQuery(data.at(0)?.total, [defaultInstrument.id, accountType]);

    return total;
};
