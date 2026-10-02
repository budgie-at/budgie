import { AccountEntityTable, AccountRepository, AccountTypeEnum, InstrumentEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

const searchAccountsAtom = databaseQueryFamily(
    [AccountEntityTable, InstrumentEntityTable],
    AccountRepository,
    (accountRepository, search: string) => accountRepository.findBySearchQuery(search)
);

const accountCountAtom = databaseQueryAtom(
    [AccountEntityTable],
    Effect.flatMap(AccountRepository, accountRepository => accountRepository.count())
);

export const useSearchAccountsGroupedQuery = (search = '', withActive = true) => {
    const result = useLiveAtomValue(searchAccountsAtom(search));
    const countResult = useLiveAtomValue(accountCountAtom);

    const filteredData = AsyncResult.getOrElse(result, () => []).filter(account => (withActive ? account.isActive : true));

    return {
        accounts: filteredData,
        total: AsyncResult.getOrElse(countResult, () => []).at(0)?.count ?? 0,
        isLoading: AsyncResult.isInitial(result),
        accountsGrouped: filteredData.reduce<AccountGroups>(
            (acc, curr) => ({
                ...acc,
                [curr.type]: [...(acc[curr.type] ?? []), curr]
            }),
            {}
        )
    };
};
