import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { CreateBankSyncCard } from '../../../account/component/create-bank-sync-card/create-bank-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';

export default function Index() {
    const { t } = useLingui();

    const monobankRoute = { pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.MONOBANK } } as const;
    const privatbankRoute = { pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.PRIVATBANK } } as const;
    const ersteRoute = { pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.ERSTE } } as const;

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            withBlur
            header={
                <PageHeader title={t`New Account`} description={t`Choose the type of account you want to add`} onGoBack={handleGoBack} />
            }
        >
            <ScrollView contentContainerClassName="gap-y-xl pt-16" showsVerticalScrollIndicator={false}>
                <CreateAccountCard
                    description={t`Everyday transactions and spending`}
                    icon={ACCOUNT_ICON.BANK}
                    title={t`Checking Account`}
                    type={AccountTypeEnum.BANK}
                />
                <CreateAccountCard
                    description={t`Emergency fund and savings goals`}
                    icon={ACCOUNT_ICON.CASH}
                    title={t`Savings Account`}
                    type={AccountTypeEnum.CASH}
                />
                <CreateAccountCard
                    description={t`Cold wallets and exchange balances`}
                    icon={ACCOUNT_ICON.CRYPTO}
                    title={t`Crypto Account`}
                    type={AccountTypeEnum.CRYPTO}
                />
                <CreateAccountCard
                    description={t`Money lent or borrowed`}
                    icon={ACCOUNT_ICON.DEBT}
                    title={t`Debt Account`}
                    type={AccountTypeEnum.DEBT}
                />

                <Text className="text-secondary-foreground text-sm px-md mt-xl">
                    <Trans>Bank Sync</Trans>
                </Text>

                <CreateBankSyncCard
                    description={t`Auto-sync accounts and transactions from Monobank`}
                    title={t`Monobank`}
                    route={monobankRoute}
                    bankProvider={ExternalSourceEnum.MONOBANK}
                />
                <CreateBankSyncCard
                    description={t`Import accounts and transactions from Privatbank XLSX export`}
                    title={t`Privatbank`}
                    route={privatbankRoute}
                    bankProvider={ExternalSourceEnum.PRIVATBANK}
                />
                <CreateBankSyncCard
                    description={t`Import accounts and transactions from Erste Bank PDF statement`}
                    title={t`Erste Bank`}
                    route={ersteRoute}
                    bankProvider={ExternalSourceEnum.ERSTE}
                />

                <MenuSpacer />
            </ScrollView>
        </Page>
    );
}
