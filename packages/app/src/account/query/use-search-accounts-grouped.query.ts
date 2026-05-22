import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

export const useSearchAccountsGroupedQuery = (search = '', withActive = true) => {
    const { data, ...rest } = useLiveQuery(accountRepository.findBySearchQuery(search), [search]);
    const { data: countData } = useLiveQuery(accountRepository.count(), []);

    const accounts = data ?? [];
    const countRows = countData ?? [];
    const filteredData = accounts.filter(account => (withActive ? account.isActive : true));

    return {
        accounts: filteredData,
        total: countRows.at(0)?.count ?? 0,
        accountsGrouped: filteredData.reduce<AccountGroups>(
            (acc, curr) => ({
                ...acc,
                [curr.type]: [...(acc[curr.type] ?? []), curr]
            }),
            {}
        ),
        ...rest
    };
};
