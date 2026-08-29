import { isDefined } from '@rnw-community/shared';

import { syncRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useAccountSync = (accountId: number) => {
    const { data, error } = useDatabaseLiveQuery(syncRepository.findByAccountId(accountId), [accountId]);

    return {
        sync: data ?? null,
        hasSync: isDefined(data),
        isLoading: !isDefined(data) && !isDefined(error),
        error
    };
};
