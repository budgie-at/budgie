import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetArchivedAccountsQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.getAllArchived());

    if (!isDefined(data)) {
        return { isLoading: true, accounts: null, updatedAt: null, error };
    }

    return { accounts: data, isLoading: false, updatedAt, error };
};
