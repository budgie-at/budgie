import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Pressable, ScrollView } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../@generic/components/icon/icon';
import { Page } from '../../@generic/components/page/page';
import { NetWorth } from '../../@generic/components/total-balance/net-worth';
import { ICONS } from '../../@generic/constant/icons.constant';
import { typedObjectEntries } from '../../@generic/utils/typed-object-entries.util';
import { AccountList } from '../../account/component/account-list/account-list';
import { AccountsEmptyState } from '../../account/component/accounts-empty-state/accounts-empty-state';
import { AccountsHeading } from '../../account/component/accounts-heading/accounts-heading';
import { useGetAccountsQuery } from '../../account/query/use-get-accounts.query';

export default function HomePage() {
    const { accounts } = useGetAccountsQuery();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const navigateToSettings = () => void router.push('/settings');

    const accountEntries = typedObjectEntries(accounts);

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <Pressable className="items-end p-md" onPress={navigateToSettings}>
                    <Icon className="text-primary" icon={ICONS.Settings} size={16} />
                </Pressable>

                <NetWorth />
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
