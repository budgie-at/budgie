import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { Page } from '../../../@generic/components/page/page';
import { PageHeader } from '../../../@generic/components/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { CreateBankSyncCard } from '../../../account/component/create-bank-sync-card/create-bank-sync-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';
import { MONOBANK_LOGO } from '../../../account/constant/monobank-logo.constant';

export default function Index() {
    const { t } = useLingui();

    const handleGoBack = () => void goBackOrReplace('/');

    return (
        <Page
            header={
                <PageHeader title={t`New Account`} description={t`Choose the type of account you want to add`} onGoBack={handleGoBack} />
            }
        >
            <ScrollView contentContainerClassName="gap-y-xl py-7xl">
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

                <Text className="text-secondary-foreground text-sm px-md mt-xl">{t`Bank Sync`}</Text>

                <CreateBankSyncCard
                    description={t`Auto-sync accounts and transactions from Monobank`}
                    image={MONOBANK_LOGO}
                    title={t`Monobank`}
                    route="/create-account/monobank"
                    variant="default"
                />
            </ScrollView>
        </Page>
    );
}
