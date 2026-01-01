import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

export const useSearchAccountsGroupedQuery = (search = '', withActive = true) => {
    const { data, ...rest } = useLiveQuery(accountRepository.findBySearchQuery(search), [search]);
    const { data: countData } = useLiveQuery(accountRepository.count(), []);

    const filteredData = data?.filter(account => (withActive ? account.isActive : true));

    return {
        accounts: filteredData,
        total: countData.at(0)?.count ?? 0,
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
