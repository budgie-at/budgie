import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { accountRepository } from '../../@generic/drizzle/db/db';

export const useAccountsWithBankSyncQuery = () => {
    const { data, ...rest } = useLiveQuery(accountRepository.findAllWithBankSync(), []);

    return {
        accounts: data as AccountWithBankSyncEntityInterface[],
        ...rest
    };
};
