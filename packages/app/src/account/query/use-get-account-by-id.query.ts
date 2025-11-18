import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useGetAccountByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
