import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { ZERO_AMOUNT } from '../../@generic/constant/zero-amount.constant';
import { accountRepository } from '../../@generic/drizzle/db/db';

export const useAccountBalanceQuery = (accountId: number) => {
    const { data } = useLiveQuery(accountRepository.getAccountBalance(accountId), [accountId]);
    const { balance } = data.at(0) ?? { balance: ZERO_AMOUNT };

    return { balance };
};
