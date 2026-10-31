import { TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionInfoDestinationEntry = (transaction: TransactionWithRelationsEntityInterface) =>
    transaction.type === TransactionTypeEnum.TRANSFER
        ? (getTransactionCategoryEntries(transaction.entries).find(entry => entry.accountId === transaction.toAccountId) ?? null)
        : null;
