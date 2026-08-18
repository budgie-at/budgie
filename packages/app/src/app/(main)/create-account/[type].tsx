import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateBankAccount } from '../../../account/component/create-bank-account/create-bank-account';
import { CreateCashAccount } from '../../../account/component/create-cash-account/create-cash-account';
import { CreateCryptoAccount } from '../../../account/component/create-crypto-account/create-crypto-account';
import { CreateDebtAccount } from '../../../account/component/create-debt-account/create-debt-account';
import { CreateDepositAccount } from '../../../account/component/create-deposit-account/create-deposit-account';
import { CreateBinanceAccount } from '../../../sync/component/create-binance-account/create-binance-account';
import { CreateErsteAccount } from '../../../sync/component/create-erste-account/create-erste-account';
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
        case AccountTypeEnum.DEPOSIT:
            return <CreateDepositAccount />;
        case AccountTypeEnum.CRYPTO:
            return <CreateCryptoAccount />;
        case ExternalSourceEnum.MONOBANK:
            return <CreateMonobankAccount />;
        case ExternalSourceEnum.PRIVATBANK:
            return <CreatePrivatbankAccount />;
        case ExternalSourceEnum.ERSTE:
            return <CreateErsteAccount />;
        case ExternalSourceEnum.BINANCE:
            return <CreateBinanceAccount />;
        default:
            return <Redirect href="/" />;
    }
}
