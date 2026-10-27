import { AccountBalanceRepository } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

export const netWorthAtom = databaseQueryFamily(
    ACCOUNT_CONVERTED_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, defaultInstrumentId: number) => accountBalanceRepository.getNetWorth(defaultInstrumentId)
);

export const useNetWorthQuery = () => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const result = useLiveAtomValue(netWorthAtom(defaultInstrumentId));

    return useCachedMicroUnitQuery(AsyncResult.getOrElse(result, () => []).at(0)?.netWorth);
};
