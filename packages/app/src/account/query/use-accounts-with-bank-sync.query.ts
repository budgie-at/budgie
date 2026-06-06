import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useAccountsWithBankSyncQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findAllWithBankSync(), []);

    const accounts: AccountWithBankSyncEntityInterface[] = data;

    return { accounts, updatedAt, error };
};
