import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { WISE_ASPSP_NAME } from '@budgie/sync';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { isNotEmptyString } from '@rnw-community/shared';

import { CreateDebtAccount } from '../../../account/component/create-debt-account/create-debt-account';
import { CreateDepositAccount } from '../../../account/component/create-deposit-account/create-deposit-account';
import { CreateSimpleAccount } from '../../../account/component/create-simple-account/create-simple-account';
import { ImportInzhurStatement } from '../../../inzhur/component/import-inzhur-statement/import-inzhur-statement';
import { CreateBinanceAccount } from '../../../sync/component/create-binance-account/create-binance-account';
import { CreateEnableBankingAccount } from '../../../sync/component/create-enable-banking-account/create-enable-banking-account';
import { CreateErsteAccount } from '../../../sync/component/create-erste-account/create-erste-account';
import { CreateMonobankAccount } from '../../../sync/component/create-monobank-account/create-monobank-account';
import { CreatePrivatbankAccount } from '../../../sync/component/create-privatbank-account/create-privatbank-account';

type AccountRouteType = AccountTypeEnum | ExternalSourceEnum;

export default function CreateAccountType() {
    const { type, connectAccountId, savedApplicationId } = useLocalSearchParams<{
        type: AccountRouteType;
        connectAccountId?: string;
        savedApplicationId?: string;
    }>();
    const connectAccountIdNumber = isNotEmptyString(connectAccountId) ? Number(connectAccountId) : null;

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
        case ExternalSourceEnum.INZHUR:
            return <ImportInzhurStatement />;
        case ExternalSourceEnum.ENABLE_BANKING:
            return (
                <CreateEnableBankingAccount
                    connectAccountId={connectAccountIdNumber}
                    savedApplicationId={savedApplicationId ?? null}
                    preselectedBankName={null}
                />
            );
        case ExternalSourceEnum.WISE:
            return <CreateEnableBankingAccount connectAccountId={null} savedApplicationId={null} preselectedBankName={WISE_ASPSP_NAME} />;
        case AccountTypeEnum.STOCKS:
        case AccountTypeEnum.SAVINGS:
        case AccountTypeEnum.BANK_SYNC:
        case AccountTypeEnum.CRYPTO_SYNC:
        case ExternalSourceEnum.MANUAL:
        case ExternalSourceEnum.REVOLUT:
        case ExternalSourceEnum.COINBASE:
        case ExternalSourceEnum.CSV:
        case ExternalSourceEnum.RECEIPT:
        case ExternalSourceEnum.APPLE_PAY_AUTOMATION:
        default:
            return <Redirect href="/" />;
    }
}
