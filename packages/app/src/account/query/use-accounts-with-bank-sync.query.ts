import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useAccountsWithBankSyncQuery = () => {
    const { data, updatedAt, error } = useLiveQuery(accountRepository.findAllWithBankSync(), []);

    const accounts: AccountWithBankSyncEntityInterface[] = isDefined(data) ? data : [];

    return { accounts, updatedAt, error };
};
