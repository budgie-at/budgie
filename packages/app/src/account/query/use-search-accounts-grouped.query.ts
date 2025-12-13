import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

export const useSearchAccountsGroupedQuery = (search = '') => {
    const { data, ...rest } = useLiveQuery(accountRepository.findBySearchQuery(search), [search]);

    return {
        accounts: data,
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
