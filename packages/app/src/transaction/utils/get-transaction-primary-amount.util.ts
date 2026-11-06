import { getTransactionCategoryEntries } from '@budgie/ledger';

import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';
import { sumEntryAmounts } from './sum-entry-amounts.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
export const getTransactionPrimaryAmount = (transaction: TransactionWithRelationsEntityInterface): number => {
    const primaryAccountId = getTransactionInfoPrimaryEntry(transaction)?.accountId;

    return sumEntryAmounts(getTransactionCategoryEntries(transaction.entries).filter(entry => entry.accountId === primaryAccountId));
};
