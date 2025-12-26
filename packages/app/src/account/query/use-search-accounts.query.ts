import { AccountFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useSearchAccountsQuery = (search = '', filter?: AccountFilterInterface) => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findBySearchQuery(search, filter), [search, filter]);

    if (!isDefined(updatedAt)) {
        return { isLoading: true, accounts: [], updatedAt: null, error };
    }

    return {
        isLoading: false,
        accounts: data,
        error
    };
};
