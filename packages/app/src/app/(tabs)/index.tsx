import { AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, Text } from 'react-native';

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

    const onAdd = async () => {
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
            <Text className="text-primary">{t`Home Screen`}</Text>

            <Card asChild>
                <Pressable onPress={() => void onAdd()}>
                    <Text className="text-primary">{t`Create Account`}</Text>
                </Pressable>
            </Card>

            <AccountList accounts={data} />
        </Page>
    );
}
