import { Trans } from '@lingui/react/macro';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AccountList } from '../../account/components/account-list/account-list';
import { useGetAccountsQuery } from '../../account/query/use-get-accounts.query';
import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { ICONS } from '../../@generic/constant/icons.constant';
import { formatMoney } from '../../@generic/utils/format-money.util';

const MOCK_BALANCE = 1_300;

export default function HomePage() {
    const { data } = useGetAccountsQuery();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const balance = formatMoney(MOCK_BALANCE);

    const navigateToSettings = () => void router.push('/settings');

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Pressable className="items-end p-md" onPress={navigateToSettings}>
                    <Icon className="text-primary" icon={ICONS.Settings} size={16} />
                </Pressable>

                <View className="items-center gap-y-md mb-5xl">
                    <Text className="uppercase text-xs text-secondary-foreground">
                        <Trans>Total Balance</Trans>
                    </Text>

                    <Text className="text-8xl text-primary font-extralight">{balance}</Text>
                </View>

                <AccountList accounts={data} />
            </ScrollView>
        </Page>
    );
}
