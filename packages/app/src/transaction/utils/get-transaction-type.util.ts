import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

export const getTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME => {
    switch (true) {
        case isPositiveAdjustmentTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        case isNegativeAdjustmentTransaction(transaction):
            return TransactionTypeEnum.EXPENSE;
        case isIncomeTransaction(transaction):
            return TransactionTypeEnum.INCOME;
        default:
            return TransactionTypeEnum.EXPENSE;
    }
};
