import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

type AccountGroups = Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>;

export const useGetAccountsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.getAll());

    if (!isDefined(updatedAt)) {
        return { isLoading: true, accounts: {}, updatedAt: null, error };
    }

    return {
        isLoading: false,
        accounts: data.reduce<AccountGroups>(
            (acc, curr) => ({
                ...acc,
                [curr.type]: [...(acc[curr.type] ?? []), curr]
            }),
            {}
        ),
        error
    };
};
