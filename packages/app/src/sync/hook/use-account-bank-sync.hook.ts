import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';

export const useAccountBankSync = (accountId: number) => {
    const { data, error } = useLiveQuery(bankSyncRepository.findByAccountId(accountId), [accountId]);

    return {
        bankSync: data ?? null,
        hasBankSync: isDefined(data),
        isLoading: !isDefined(data) && !isDefined(error),
        error
    };
};
