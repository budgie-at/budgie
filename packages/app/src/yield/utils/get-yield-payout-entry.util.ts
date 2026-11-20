import { TransactionTypeEnum } from '@budgie/contracts';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getYieldPayoutEntry = (transaction: TransactionWithRelationsEntityInterface) => {
    const account = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;

    return transaction.entries.find(candidate => candidate.accountId === account?.id) ?? null;
};
