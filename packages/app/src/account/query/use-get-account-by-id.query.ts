import { AccountEntityTable, AccountRepository, InstrumentEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const accountByIdAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable],
    AccountRepository,
    (accountRepository, id: number) => accountRepository.findById(id)
);

export const useGetAccountByIdQuery = (id: number) => {
    const result = useLiveAtomValue(accountByIdAtom(id));
    const account = AsyncResult.getOrElse(result, () => null);

    if (!isDefined(account)) {
        return { isLoading: true, account: null };
    }

    return { account, isLoading: false };
};
