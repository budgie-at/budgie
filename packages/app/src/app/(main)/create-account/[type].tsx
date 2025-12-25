import { AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateBankAccount } from '../../../account/component/create-bank-account/create-bank-account';
import { CreateCashAccount } from '../../../account/component/create-cash-account/create-cash-account';
import { CreateMonobankAccount } from '../../../account/component/create-monobank-account/create-monobank-account';

type AccountRouteType = AccountTypeEnum | 'monobank';

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: AccountRouteType }>();

    switch (type) {
        case AccountTypeEnum.CASH:
            return <CreateCashAccount />;
        case AccountTypeEnum.BANK:
            return <CreateBankAccount />;
        case 'monobank':
            return <CreateMonobankAccount />;
        default:
            return <Redirect href="/" />;
    }
}
