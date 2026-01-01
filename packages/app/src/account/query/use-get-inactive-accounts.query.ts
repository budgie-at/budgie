import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useGetInactiveAccountsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.getAllInactive());

    if (!isDefined(data)) {
        return { isLoading: true, accounts: null, updatedAt: null, error };
    }

    return { accounts: data, isLoading: false, updatedAt, error };
};
