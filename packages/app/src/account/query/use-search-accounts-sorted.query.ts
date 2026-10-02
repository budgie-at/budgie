import { AccountBalanceEntityTable, AccountEntityTable, AccountRepository, InstrumentEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { AccountFilterInterface } from '@budgie/contracts';

const searchAccountsSortedAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable, AccountBalanceEntityTable],
    AccountRepository,
    (accountRepository, [search, filter]: readonly [string, AccountFilterInterface]) =>
        accountRepository.findBySearchQuerySortedByBalance(search, filter)
);

export const useSearchAccountsSortedQuery = (search = '', filter?: AccountFilterInterface) => {
    const result = useLiveAtomValue(
        searchAccountsSortedAtom([
            search,
            {
                debtType: filter?.debtType,
                excludeAccountId: filter?.excludeAccountId,
                excludeTypes: filter?.excludeTypes,
                includeTypes: filter?.includeTypes,
                onlyActive: filter?.onlyActive
            }
        ])
    );

    if (AsyncResult.isInitial(result)) {
        return { isLoading: true, accounts: [] };
    }

    return { isLoading: false, accounts: AsyncResult.getOrElse(result, () => []) };
};
