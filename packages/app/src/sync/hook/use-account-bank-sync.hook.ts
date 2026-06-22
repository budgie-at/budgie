import { isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';

export const useAccountBankSync = (accountId: number) => {
    const { data, error } = useDatabaseLiveQuery(bankSyncRepository.findByAccountId(accountId), [accountId]);

    return {
        bankSync: data ?? null,
        hasBankSync: isDefined(data),
        isLoading: !isDefined(data) && !isDefined(error),
        error
    };
};
