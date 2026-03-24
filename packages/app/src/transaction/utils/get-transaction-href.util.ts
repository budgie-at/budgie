import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isExpenseTransaction,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    isTransferTransaction
} from '@budgie/contracts';
import { type Href } from 'expo-router';

export const getTransactionHref = (transaction: TransactionWithRelationsEntityInterface): Href => {
    const { id } = transaction;

    if (isTransferTransaction(transaction) || transaction.type === TransactionTypeEnum.DEBT) {
        return `/transactions/${id}/transfer`;
    }

    if (isIncomeTransaction(transaction) || isPositiveAdjustmentTransaction(transaction)) {
        return `/transactions/${id}/income`;
    }

    if (isExpenseTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return `/transactions/${id}/expense`;
    }

    return '/';
};
