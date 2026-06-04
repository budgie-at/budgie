import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getTransactionCategoryEntries } from './get-transaction-category-entries.util';

export const getTransactionCategoryLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    balanceAdjustmentLabel: string,
    categoriesLabel: string
): string | null => {
    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return balanceAdjustmentLabel;
    }

    const categoryEntries = getTransactionCategoryEntries(transaction.entries);

    if (categoryEntries.length > 1) {
        return categoriesLabel;
    }

    const entry = categoryEntries.at(0);

    if (isDefined(entry?.category?.title)) {
        return entry.category.title;
    }

    return null;
};
