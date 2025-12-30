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
    switch (true) {
        case isPositiveAdjustmentTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        case isNegativeAdjustmentTransaction(transaction):
            return TransactionTypeEnum.EXPENSE;
        case isIncomeTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        case isExpenseTransaction(transaction):
            return TransactionTypeEnum.EXPENSE;
        case transaction.type === TransactionTypeEnum.DEBT:
            return TransactionTypeEnum.DEBT;
        default:
            return TransactionTypeEnum.TRANSFER;
    }
};
