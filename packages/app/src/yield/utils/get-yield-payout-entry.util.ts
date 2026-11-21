import { getYieldPayoutAccount } from './get-yield-payout-account.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getYieldPayoutEntry = (transaction: TransactionWithRelationsEntityInterface) => {
    const account = getYieldPayoutAccount(transaction);

    return transaction.entries.find(candidate => candidate.accountId === account?.id) ?? null;
};
