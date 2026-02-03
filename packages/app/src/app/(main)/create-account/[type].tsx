import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateBankAccount } from '../../../account/component/create-bank-account/create-bank-account';
import { CreateCashAccount } from '../../../account/component/create-cash-account/create-cash-account';
import { CreateDebtAccount } from '../../../account/component/create-debt-account/create-debt-account';
import { CreateMonobankAccount } from '../../../sync/component/create-monobank-account/create-monobank-account';
import { CreatePrivatbankAccount } from '../../../sync/component/create-privatbank-account/create-privatbank-account';

type AccountRouteType = AccountTypeEnum | ExternalSourceEnum;

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: AccountRouteType }>();

    switch (type) {
        case AccountTypeEnum.CASH:
            return <CreateCashAccount />;
        case AccountTypeEnum.BANK:
            return <CreateBankAccount />;
        case AccountTypeEnum.DEBT:
            return <CreateDebtAccount />;
        case ExternalSourceEnum.MONOBANK:
            return <CreateMonobankAccount />;
        case ExternalSourceEnum.PRIVATBANK:
            return <CreatePrivatbankAccount />;
        default:
            return <Redirect href="/" />;
    }
}
