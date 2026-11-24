import { AccountEntityTable, AccountRepository, InstrumentEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const accountByIdAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable],
    AccountRepository,
    (accountRepository, id: number) => accountRepository.findById(id)
);

export const useGetAccountByIdQuery = (id: number) => {
    const result = useLiveAtomValue(accountByIdAtom(id));

    return {
        account: AsyncResult.getOrElse(result, () => null) ?? null,
        isLoading: AsyncResult.isInitial(result)
    };
};
