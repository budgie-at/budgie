import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { CreateBankSyncCard } from '../../../account/component/create-bank-sync-card/create-bank-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';

export default function Index() {
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            header={
                <PageHeader title={t`New Account`} description={t`Choose the type of account you want to add`} onGoBack={handleGoBack} />
            }
        >
            <ScrollView contentContainerClassName="gap-y-xl py-7xl" showsVerticalScrollIndicator={false}>
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
                    route={`/create-account/${ExternalSourceEnum.MONOBANK}`}
                    bankProvider={ExternalSourceEnum.MONOBANK}
                />
                <CreateBankSyncCard
                    description={t`Import accounts and transactions from Privatbank XLSX export`}
                    title={t`Privatbank`}
                    route={`/create-account/${ExternalSourceEnum.PRIVATBANK}`}
                    bankProvider={ExternalSourceEnum.PRIVATBANK}
                />
                <CreateBankSyncCard
                    description={t`Import accounts and transactions from Erste Bank PDF statement`}
                    title={t`Erste Bank`}
                    route={`/create-account/${ExternalSourceEnum.ERSTE}`}
                    bankProvider={ExternalSourceEnum.ERSTE}
                />
            </ScrollView>
        </Page>
    );
}
