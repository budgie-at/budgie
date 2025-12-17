import {
    isExpenseTransaction,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';

export const getTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME | TransactionTypeEnum.TRANSFER => {
    switch (true) {
        case isPositiveAdjustmentTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        case isNegativeAdjustmentTransaction(transaction):
            return TransactionTypeEnum.EXPENSE;
        case isIncomeTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        case isExpenseTransaction(transaction):
            return TransactionTypeEnum.EXPENSE;
        default:
            return TransactionTypeEnum.TRANSFER;
    }
};
