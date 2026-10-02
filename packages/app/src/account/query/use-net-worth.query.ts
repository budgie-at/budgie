import { AccountBalanceRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

const netWorthAtom = databaseQueryFamily(
    ACCOUNT_CONVERTED_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, defaultInstrumentId: number) => accountBalanceRepository.getNetWorth(defaultInstrumentId)
);

export const useNetWorthQuery = () => {
    const { defaultInstrument } = useSettingsContext();
    const result = useLiveAtomValue(netWorthAtom(defaultInstrument.id));

    return useCachedMicroUnitQuery(AsyncResult.getOrElse(result, () => []).at(0)?.netWorth);
};
