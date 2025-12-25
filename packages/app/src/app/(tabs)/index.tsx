import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { NetWorth } from '../../@generic/components/total-balance/net-worth';
import { ICONS } from '../../@generic/constant/icons.constant';
import { SyncProgressBar } from '../../@generic/sync/component/sync-progress-bar/sync-progress-bar';
import { typedObjectEntries } from '../../@generic/utils/typed-object-entries.util';
import { AccountList } from '../../account/component/account-list/account-list';
import { AccountsEmptyState } from '../../account/component/accounts-empty-state/accounts-empty-state';
import { AccountsHeading } from '../../account/component/accounts-heading/accounts-heading';
import { useSearchAccountsGroupedQuery } from '../../account/query/use-search-accounts-grouped.query';

export default function HomePage() {
    const { accountsGrouped } = useSearchAccountsGroupedQuery();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const navigateToSettings = () => void router.push('/settings');

    const accountEntries = typedObjectEntries(accountsGrouped);

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <HapticPressable className="ml-auto p-md" onPress={navigateToSettings} hitSlop={10}>
                    <Icon className="text-primary" icon={ICONS.Settings} size={16} />
                </HapticPressable>

                <NetWorth />
                <View className="px-4 mt-4">
                    <SyncProgressBar />
                </View>
                <AccountsHeading />

                {isNotEmptyArray(accountEntries) ? (
                    accountEntries.map(([key, value]) => <AccountList type={key} accounts={value ?? []} key={key} />)
                ) : (
                    <AccountsEmptyState />
                )}
            </ScrollView>
        </Page>
    );
}
