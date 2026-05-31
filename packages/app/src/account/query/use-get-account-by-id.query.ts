import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useGetAccountByIdQuery = (id: number, includeArchived = false) => {
    const query = includeArchived ? accountRepository.findByIdIncludingArchived(id) : accountRepository.findById(id);
    const { data, updatedAt, error } = useLiveQuery(query, [id, includeArchived]);

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
