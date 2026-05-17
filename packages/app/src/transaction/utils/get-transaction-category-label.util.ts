import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const getTransactionCategoryLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    balanceAdjustmentLabel: string,
    categoriesLabel: string
): string | null => {
    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return balanceAdjustmentLabel;
    }

    if (transaction.entries.length > 1) {
        return categoriesLabel;
    }

    const entry = transaction.entries.at(0);

    if (isDefined(entry?.category?.title)) {
        return entry.category.title;
    }

    return null;
};
