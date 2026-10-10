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

export const getTransactionEditHref = (transaction: TransactionWithRelationsEntityInterface): Href | null => {
    const params = { id: String(transaction.id) };

    if (isTransferTransaction(transaction) || transaction.type === TransactionTypeEnum.DEBT) {
        return { pathname: '/transactions/[id]/transfer/edit', params };
    }

    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return { pathname: '/transactions/[id]/adjustment', params };
    }

    if (isIncomeTransaction(transaction)) {
        return { pathname: '/transactions/[id]/income/edit', params };
    }

    if (isExpenseTransaction(transaction)) {
        return { pathname: '/transactions/[id]/expense/edit', params };
    }

    return null;
};
