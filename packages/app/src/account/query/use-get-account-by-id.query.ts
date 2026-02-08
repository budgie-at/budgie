import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useGetAccountByIdQuery = (id: number) => {
    const queryStart = performance.now();
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findById(id), [id]);
    // eslint-disable-next-line no-console
    console.log(`[perf] useGetAccountByIdQuery(${id}): ${Math.round(performance.now() - queryStart)}ms`); // eslint-disable-line lingui/no-unlocalized-strings

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
