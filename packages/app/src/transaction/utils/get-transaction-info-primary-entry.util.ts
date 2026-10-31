import { TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionInfoPrimaryEntry = (transaction: TransactionWithRelationsEntityInterface) => {
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const accountId = transaction.type === TransactionTypeEnum.INCOME ? transaction.toAccountId : transaction.fromAccountId;

    return categoryEntries.find(entry => entry.accountId === accountId) ?? categoryEntries.at(0);
};
