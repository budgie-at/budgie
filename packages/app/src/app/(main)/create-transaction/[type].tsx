import { TransactionTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateIncomeTransaction } from '../../../transaction/components/create-income-transaction/create-income-transaction';

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: TransactionTypeEnum }>();

    switch (type) {
        case TransactionTypeEnum.INCOME:
            return <CreateIncomeTransaction />;
        default:
            return <Redirect href="/" />;
    }
}
