import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateExpenseTransaction } from '../../../transaction/components/create-expense-transaction/create-expense-transaction';
import { CreateIncomeTransaction } from '../../../transaction/components/create-income-transaction/create-income-transaction';

export default function CreateTransaction() {
    const { type } = useLocalSearchParams<{ type: TransactionTypeEnum }>();

    switch (type) {
        case TransactionTypeEnum.INCOME:
            return <CreateIncomeTransaction />;
        case TransactionTypeEnum.EXPENSE:
            return <CreateExpenseTransaction />;
        default:
            return <Redirect href="/" />;
    }
}
