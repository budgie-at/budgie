import { AccountTypeEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateAccountBank } from '../../../@account/components/create-account/create-account-bank';
import { CreateAccountCash } from '../../../@account/components/create-account/create-account-cash';
import { CreateAccountCrypto } from '../../../@account/components/create-account/create-account-crypto';
import { CreateAccountStocks } from '../../../@account/components/create-account/create-account-stocks';

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: AccountTypeEnum }>();

    switch (type) {
        case AccountTypeEnum.CASH:
            return <CreateAccountCash />;
        case AccountTypeEnum.BANK:
            return <CreateAccountBank />;
        case AccountTypeEnum.CRYPTO:
            return <CreateAccountCrypto />;
        case AccountTypeEnum.STOCKS:
            return <CreateAccountStocks />;
        default:
            return <Redirect href="/" />;
    }
}
