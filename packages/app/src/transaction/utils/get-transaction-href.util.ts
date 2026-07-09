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
        return { pathname: '/transactions/[id]/transfer', params: { id: String(id) } };
    }

    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return { pathname: '/transactions/[id]/adjustment', params: { id: String(id) } };
    }

    if (isIncomeTransaction(transaction)) {
        return { pathname: '/transactions/[id]/income', params: { id: String(id) } };
    }

    if (isExpenseTransaction(transaction)) {
        return { pathname: '/transactions/[id]/expense', params: { id: String(id) } };
    }

    return '/';
};
