import { TransactionTypeEnum } from '@budgie/contracts';
import { type Href } from 'expo-router';

export const getTransactionFeeEditHref = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME | TransactionTypeEnum.TRANSFER,
    transactionId: number
): Href => ({
    pathname: `/transactions/[id]/${type.toLowerCase()}/edit`,
    params: { id: String(transactionId), openFee: '1' }
});
