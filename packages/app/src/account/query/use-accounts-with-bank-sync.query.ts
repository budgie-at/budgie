import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useAccountsWithBankSyncQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findAllWithBankSync(), []);

    const accounts: AccountWithBankSyncEntityInterface[] = isDefined(data) ? data : [];

    return { accounts, updatedAt, error };
};
