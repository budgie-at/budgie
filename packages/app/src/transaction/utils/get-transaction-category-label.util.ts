import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

export const getTransactionCategoryLabel = (
    transaction: TransactionWithRelationsEntityInterface,
    balanceAdjustmentLabel: string,
    categoriesLabel: string
): string => {
    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return balanceAdjustmentLabel;
    }

    if (transaction.entries.length > 1) {
        return categoriesLabel;
    }

    const entry = transaction.entries.at(0);

    return entry?.category?.title ?? transaction.type;
};
