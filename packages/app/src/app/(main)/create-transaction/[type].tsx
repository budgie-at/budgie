import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateExpenseTransaction } from '../../../transaction/components/create-expense-transaction/create-expense-transaction';
import { CreateIncomeTransaction } from '../../../transaction/components/create-income-transaction/create-income-transaction';
import { CreateTransferTransaction } from '../../../transaction/components/create-transfer-transaction/create-transfer-transaction';

export default function CreateTransaction() {
    const { type } = useLocalSearchParams<{ type: TransactionTypeEnum }>();

    switch (type) {
        case TransactionTypeEnum.INCOME:
            return <CreateIncomeTransaction />;
        case TransactionTypeEnum.EXPENSE:
            return <CreateExpenseTransaction />;
        case TransactionTypeEnum.TRANSFER:
            return <CreateTransferTransaction />;
        default:
            return <Redirect href="/" />;
    }
}
