import { AccountTypeEnum } from '@budgie/contracts';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from 'expo-sqlite';
import { ScrollView } from 'react-native';

import { AccountList } from '../../@account/components/account-list/account-list';
import { useGetAccountsQuery } from '../../@account/query/use-get-accounts.query';
import { Page } from '../../@generic/components/page/page';

export default function HomePage() {
    const { data } = useGetAccountsQuery();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    return (
        <Page>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {Object.entries(data).map(([key, value]) => (
                    <AccountList type={key as AccountTypeEnum} accounts={value} key={key} />
                ))}
            </ScrollView>
        </Page>
    );
}
