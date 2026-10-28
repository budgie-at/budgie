import { AccountBalanceRepository } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../../account/constant/account-balance-tables.constant';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const liquidBalanceAtom = databaseQueryFamily(
    ACCOUNT_CONVERTED_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, [defaultInstrumentId, isRunwayCryptoIncluded]: readonly [number, boolean]) =>
        accountBalanceRepository.getLiquidTotal(defaultInstrumentId, isRunwayCryptoIncluded)
);

export const useLiquidBalanceQuery = (): number => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const isRunwayCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const result = useLiveAtomValue(liquidBalanceAtom([defaultInstrumentId, isRunwayCryptoIncluded]));

    return AsyncResult.getOrElse(result, () => []).at(0)?.total ?? 0;
};
