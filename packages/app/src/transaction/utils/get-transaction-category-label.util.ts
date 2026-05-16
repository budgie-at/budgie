import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { getTransactionEntryLabel } from './get-transaction-entry-label.util';

export const getTransactionCategoryLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    balanceAdjustmentLabel: string,
    categoriesLabel: string,
    resolvedCategoryTitle: string | undefined
): string => {
    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return balanceAdjustmentLabel;
    }

    if (transaction.entries.length > 1) {
        return categoriesLabel;
    }

    const entry = transaction.entries.at(0);

    return getTransactionEntryLabel(entry, transaction.type, resolvedCategoryTitle);
};
