import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { CreateAccountCard } from '../../../@account/components/create-account-card/create-account-card';
import { Page } from '../../../@generic/components/page/page';

export default function CreateAccountPage() {
    const { t } = useLingui();

    return (
        <Page>
            <View className="gap-y-[15px] mb-[30px]">
                <Text className="text-primary text-[30px] font-semibold">{t`New Account`}</Text>
                <Text className="text-secondary-foreground text-[14px]">{t`Choose the type of account you want to add`}</Text>
            </View>

            <ScrollView contentContainerClassName="gap-y-[12px]">
                <CreateAccountCard
                    description={t`Everyday transactions and spending`}
                    icon="CreditCard"
                    title={t`Checking Account`}
                    type={AccountTypeEnum.BANK}
                />
                <CreateAccountCard
                    description={t`Emergency fund and savings goals`}
                    icon="Wallet"
                    title={t`Savings Account`}
                    type={AccountTypeEnum.CASH}
                />
                <CreateAccountCard
                    description={t`Cryptocurrency holdings`}
                    icon="Bitcoin"
                    title={t`Crypto Wallet`}
                    type={AccountTypeEnum.CRYPTO}
                />
                <CreateAccountCard
                    description={t`Individual stock positions`}
                    icon="TrendingUp"
                    title={t`Stock Portfolio`}
                    type={AccountTypeEnum.STOCKS}
                />
            </ScrollView>
        </Page>
    );
}
