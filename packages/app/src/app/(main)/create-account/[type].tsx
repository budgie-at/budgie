import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { CreateDebtAccount } from '../../../account/component/create-debt-account/create-debt-account';
import { CreateDepositAccount } from '../../../account/component/create-deposit-account/create-deposit-account';
import { CreateSimpleAccount } from '../../../account/component/create-simple-account/create-simple-account';
import { CreateBinanceAccount } from '../../../sync/component/create-binance-account/create-binance-account';
import { CreateErsteAccount } from '../../../sync/component/create-erste-account/create-erste-account';
import { CreateMonobankAccount } from '../../../sync/component/create-monobank-account/create-monobank-account';
import { CreatePrivatbankAccount } from '../../../sync/component/create-privatbank-account/create-privatbank-account';

type AccountRouteType = AccountTypeEnum | ExternalSourceEnum;

export default function CreateAccountType() {
    const { type } = useLocalSearchParams<{ type: AccountRouteType }>();

    switch (type) {
        case AccountTypeEnum.CASH:
        case AccountTypeEnum.BANK:
        case AccountTypeEnum.CRYPTO:
            return <CreateSimpleAccount type={type} />;
        case AccountTypeEnum.DEBT:
            return <CreateDebtAccount />;
        case AccountTypeEnum.DEPOSIT:
            return <CreateDepositAccount />;
        case ExternalSourceEnum.MONOBANK:
            return <CreateMonobankAccount />;
        case ExternalSourceEnum.PRIVATBANK:
            return <CreatePrivatbankAccount />;
        case ExternalSourceEnum.ERSTE:
            return <CreateErsteAccount />;
        case ExternalSourceEnum.BINANCE:
            return <CreateBinanceAccount />;
        case AccountTypeEnum.STOCKS:
        case AccountTypeEnum.SAVINGS:
        case AccountTypeEnum.BANK_SYNC:
        case AccountTypeEnum.CRYPTO_SYNC:
        case ExternalSourceEnum.MANUAL:
        case ExternalSourceEnum.REVOLUT:
        case ExternalSourceEnum.COINBASE:
        case ExternalSourceEnum.WISE:
        case ExternalSourceEnum.CSV:
        default:
            return <Redirect href="/" />;
    }
}
