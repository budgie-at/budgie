import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useGetAccountByIdQuery = (id: number) => {
    const { data, updatedAt, error } = useDatabaseLiveQuery(accountRepository.findById(id), [id]);

    if (!isDefined(data)) {
        return { isLoading: true, account: null, updatedAt: null, error };
    }

    return { account: data, isLoading: false, updatedAt, error };
};
