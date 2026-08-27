import { TransactionTypeEnum } from '@budgie/contracts';
import { type Href } from 'expo-router';

export const getTransactionFeeEditHref = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME | TransactionTypeEnum.TRANSFER,
    transactionId: number
): Href => {
    const params = { id: String(transactionId), openFee: '1' };

    if (type === TransactionTypeEnum.EXPENSE) {
        return { pathname: '/transactions/[id]/expense/edit', params };
    }

    if (type === TransactionTypeEnum.INCOME) {
        return { pathname: '/transactions/[id]/income/edit', params };
    }

    return { pathname: '/transactions/[id]/transfer/edit', params };
};
