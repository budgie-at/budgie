import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from 'expo-sqlite';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyArray } from '@rnw-community/shared';

import { AnimatedSectionList } from '../../@generic/component/animated-section-list/animated-section-list';
import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../@generic/constant/floating-tab-bar.constant';
import { typedObjectEntries } from '../../@generic/utils/typed-object-entries.util';
import { AccountGridItem } from '../../account/component/account-grid-item/account-grid-item';
import { AccountSectionHeader } from '../../account/component/account-section-header/account-section-header';
import { AccountsEmptyState } from '../../account/component/accounts-empty-state/accounts-empty-state';
import { useSearchAccountsGroupedQuery } from '../../account/query/use-search-accounts-grouped.query';

interface AccountRowInterface {
    readonly left: AccountWithInstrumentEntityInterface;
    readonly right?: AccountWithInstrumentEntityInterface;
}

interface AccountSectionInterface {
    readonly type: AccountTypeEnum;
    readonly data: AccountRowInterface[];
}

const pairAccountsIntoRows = (accounts: AccountWithInstrumentEntityInterface[]): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let i = 0; i < accounts.length; i += 2) {
        rows.push({
            left: accounts[i],
            right: accounts[i + 1]
        });
    }

    return rows;
};

export default function HomePage() {
    const { accountsGrouped } = useSearchAccountsGroupedQuery('', true);
    const { bottom } = useSafeAreaInsets();

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const scrollY = useSharedValue(0);

    const contentContainerStyle = { paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom, paddingHorizontal: 20 };

    const accountEntries = typedObjectEntries(accountsGrouped);

    const sections: AccountSectionInterface[] = accountEntries
        .filter(([, accounts]) => isNotEmptyArray(accounts))
        .map(([type, accounts]) => ({
            type,
            data: pairAccountsIntoRows(accounts ?? [])
        }));

    const renderSectionHeader = ({ section }: { section: AccountSectionInterface }) => <AccountSectionHeader type={section.type} />;

    const renderItem = ({ item, section }: { item: AccountRowInterface; section: AccountSectionInterface }) => (
        <View className="flex-row mb-3">
            <AccountGridItem account={item.left} type={section.type} isLeft />
            {item.right ? <AccountGridItem account={item.right} type={section.type} isLeft={false} /> : <View className="flex-1" />}
        </View>
    );

    const keyExtractor = (item: AccountRowInterface) => String(item.left.id);

    return (
        <View className="flex-1 bg-background">
            <CollapsibleHeader scrollY={scrollY} />

            {isNotEmptyArray(sections) ? (
                <AnimatedSectionList
                    scrollY={scrollY}
                    sections={sections}
                    renderSectionHeader={renderSectionHeader}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={contentContainerStyle}
                />
            ) : (
                <View className="flex-1 px-5xl">
                    <AccountsEmptyState />
                </View>
            )}
        </View>
    );
}
