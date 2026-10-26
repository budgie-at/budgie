import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isExpenseTransaction,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

export const getTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME | TransactionTypeEnum.TRANSFER | TransactionTypeEnum.DEBT => {
    if (isPositiveAdjustmentTransaction(transaction)) {
        return TransactionTypeEnum.INCOME;
    }

    if (isNegativeAdjustmentTransaction(transaction)) {
        return TransactionTypeEnum.EXPENSE;
    }

    if (isIncomeTransaction(transaction)) {
        return TransactionTypeEnum.INCOME;
    }

    if (isExpenseTransaction(transaction)) {
        return TransactionTypeEnum.EXPENSE;
    }

    if (transaction.type === TransactionTypeEnum.DEBT) {
        return TransactionTypeEnum.DEBT;
    }

    return TransactionTypeEnum.TRANSFER;
};
