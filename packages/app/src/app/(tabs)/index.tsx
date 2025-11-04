import { AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, Text } from 'react-native';

import { AccountList } from '../../@account/components/account-list/account-list';
import { createAccountMutation } from '../../@account/mutation/create-account.mutation';
import { useGetAccountsQuery } from '../../@account/query/use-get-accounts.query';
import { Card } from '../../@generic/components/card/card';
import { Page } from '../../@generic/components/page/page';
import { useVibration } from '../../@generic/hooks/use-vibration.hook';

export default function HomePage() {
    const { data } = useGetAccountsQuery();
    const [, hapticImpact] = useVibration();
    const { t } = useLingui();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const handleCardPress = async () => {
        await createAccountMutation({
            balance: 0,
            title: 'example',
            currency: CurrencyEnum.UAH,
            type: AccountTypeEnum.CASH
        });
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Text className="text-primary">{t`Home Screen`}</Text>

                <Card  onPress={handleCardPress}>
                    <Text className="text-primary">{t`Create Account`}</Text>
                </Card>

                <AccountList accounts={data} />
            </ScrollView>
        </Page>
    );
}
