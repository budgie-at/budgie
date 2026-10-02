import { AccountBalanceRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../../account/constant/account-balance-tables.constant';
import { useSettingsContext } from '../../settings/context/settings.context';

const liquidBalanceAtom = databaseQueryFamily(
    ACCOUNT_CONVERTED_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, [defaultInstrumentId, isRunwayCryptoIncluded]: readonly [number, boolean]) =>
        accountBalanceRepository.getLiquidTotal(defaultInstrumentId, isRunwayCryptoIncluded)
);

export const useLiquidBalanceQuery = (): number => {
    const { defaultInstrument, settings } = useSettingsContext();
    const result = useLiveAtomValue(liquidBalanceAtom([defaultInstrument.id, settings.isRunwayCryptoIncluded]));

    return AsyncResult.getOrElse(result, () => []).at(0)?.total ?? 0;
};
