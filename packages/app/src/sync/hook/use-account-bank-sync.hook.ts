import { isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useAccountBankSync = (accountId: number) => {
    const { data, error } = useLiveQuery(bankSyncRepository.findByAccountId(accountId), [accountId]);

    return {
        bankSync: data ?? null,
        hasBankSync: isDefined(data),
        isLoading: !isDefined(data) && !isDefined(error),
        error
    };
};
