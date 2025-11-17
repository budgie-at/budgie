import { AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateBankAccount } from '../../../account/component/create-bank-account/create-bank-account';
import { CreateCashAccount } from '../../../account/component/create-cash-account/create-cash-account';

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: AccountTypeEnum }>();

    switch (type) {
        case AccountTypeEnum.CASH:
            return <CreateCashAccount />;
        case AccountTypeEnum.BANK:
            return <CreateBankAccount />;
        default:
            return <Redirect href="/" />;
    }
}
