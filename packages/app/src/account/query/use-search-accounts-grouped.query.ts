import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

export const useSearchAccountsGroupedQuery = (search = '') => {
    const { data, ...rest } = useLiveQuery(accountRepository.findBySearchQuery(search), [search]);
    const { data: countData } = useLiveQuery(accountRepository.count(), []);

    return {
        accounts: data,
        total: countData.at(0)?.count ?? 0,
        accountsGrouped: data.reduce<AccountGroups>(
            (acc, curr) => ({
                ...acc,
                [curr.type]: [...(acc[curr.type] ?? []), curr]
            }),
            {}
        ),
        ...rest
    };
};
