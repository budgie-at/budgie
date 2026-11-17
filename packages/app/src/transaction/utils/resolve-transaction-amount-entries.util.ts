import { isOutflowEntryType } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { sumEntryAmounts } from './sum-entry-amounts.util';

import type { AggregatedTransactionEntryInterface } from '../interface/aggregated-transaction-entry.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const sumEntryBaseAmounts = (entries: TransactionWithRelationsEntityInterface['entries']): number | null => {
    if (entries.some(entry => !isDefined(entry.baseAmount))) {
        return null;
    }

    return entries.reduce((sum, entry) => sum + (entry.baseAmount ?? 0), 0);
};

const getAggregatedEntry = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): AggregatedTransactionEntryInterface | null => {
    const entries = transaction.entries.filter(entry => entry.accountId === accountId);

    return isNotEmptyArray(entries) ? { ...entries[0], amount: sumEntryAmounts(entries), baseAmount: sumEntryBaseAmounts(entries) } : null;
};

const getContextualEntry = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): AggregatedTransactionEntryInterface | null => {
    const entry = getAggregatedEntry(transaction, accountId);

    if (!isDefined(entry) || entry.account.id === transaction.fromAccountId || entry.account.id === transaction.toAccountId) {
        return null;
    }

    return entry;
};

export const resolveTransactionAmountEntries = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const contextualEntry = getContextualEntry(transaction, accountId);
    const fromEntry = getAggregatedEntry(transaction, transaction.fromAccountId);
    const toEntry = getAggregatedEntry(transaction, transaction.toAccountId);

    if (!isDefined(contextualEntry)) {
        return { fromEntry, toEntry };
    }

    if (isOutflowEntryType(contextualEntry.type)) {
        return { fromEntry: contextualEntry, toEntry };
    }

    return { fromEntry, toEntry: contextualEntry };
};
