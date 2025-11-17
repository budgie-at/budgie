import { PRECISION } from '@budgie/contracts';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, ScrollView } from 'react-native';

import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { TotalBalance } from '../../@generic/components/total-balance/total-balance';
import { ICONS } from '../../@generic/constant/icons.constant';
import { AccountList } from '../../account/components/account-list/account-list';
import { useGetAccountsQuery } from '../../account/query/use-get-accounts.query';
import { formatMoney } from '../../i18n/util/format-money.util';

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const MOCK_BALANCE = 1_123_213.12 * PRECISION;

export default function HomePage() {
    const { data } = useGetAccountsQuery();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const navigateToSettings = () => void router.push('/settings');

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Pressable className="items-end p-md" onPress={navigateToSettings}>
                    <Icon className="text-primary" icon={ICONS.Settings} size={16} />
                </Pressable>

                <TotalBalance balance={MOCK_BALANCE} />

                <AccountList accounts={data} />
            </ScrollView>
        </Page>
    );
}
