import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetAccountByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
