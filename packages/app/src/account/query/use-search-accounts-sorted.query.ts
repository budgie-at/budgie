import { AccountBalanceEntityTable, AccountEntityTable, AccountRepository, InstrumentEntityTable } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useDeferredValue } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { AccountFilterInterface } from '@budgie/contracts';

export const searchAccountsSortedAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable, AccountBalanceEntityTable],
    AccountRepository,
    (accountRepository, [search, filter]: readonly [string, AccountFilterInterface]) =>
        accountRepository.findBySearchQuerySortedByBalance(search, filter)
);

export const useSearchAccountsSortedQuery = (search = '', filter?: AccountFilterInterface) => {
    const deferredSearch = useDeferredValue(search);
    const atom = searchAccountsSortedAtom([deferredSearch, filter ?? {}]);
    const result = useLiveAtomValue(atom);
    const currentResult = useAtomValue(atom);

    return {
        accounts: AsyncResult.getOrElse(result, () => []),
        isLoading: AsyncResult.isInitial(result),
        isSearchPending: search !== deferredSearch || AsyncResult.isInitial(currentResult)
    };
};
