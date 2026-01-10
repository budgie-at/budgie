import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

interface Options {
    readonly skip?: boolean;
}

const SKIP_ID = -1;

export const useGetAccountByIdQuery = (id: number, options: Options = {}) => {
    const { skip = false } = options;
    const queryId = skip ? SKIP_ID : id;
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findById(queryId), [queryId]);

    if (skip) {
        return { isLoading: false, account: null, updatedAt: null, error: null };
    }

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
