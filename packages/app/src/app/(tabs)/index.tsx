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
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useGetActiveBudgetQuery } from '../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../budget/query/use-get-budget-calculation.query';

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

const buildSections = (
    accountsGrouped: Partial<Record<AccountTypeEnum, AccountWithInstrumentEntityInterface[]>>
): AccountSectionInterface[] =>
    typedObjectEntries(accountsGrouped)
        .filter((entry): entry is [AccountTypeEnum, AccountWithInstrumentEntityInterface[]] => isNotEmptyArray(entry[1]))
        .map(([type, accounts]) => ({
            type,
            data: pairAccountsIntoRows(accounts)
        }));

export default function HomePage() {
    const { accountsGrouped } = useSearchAccountsGroupedQuery('', true);
    const { bottom } = useSafeAreaInsets();
    const { budget } = useGetActiveBudgetQuery();
    const { calculation, isLoading: isBudgetLoading } = useGetBudgetCalculationQuery(budget);

    const db = useSQLiteContext();
    useDrizzleStudio(db);

    const scrollY = useSharedValue(0);
    const bottomPadding = FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN + bottom;
    const sections = buildSections(accountsGrouped);
    const listContentContainerStyle = { paddingBottom: bottomPadding, paddingHorizontal: 20 };
    const emptyStateStyle = { paddingBottom: bottomPadding };

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
                    contentContainerStyle={listContentContainerStyle}
                    ListHeaderComponent={
                        <View className="mb-xl">
                            <BudgetWidget
                                calculation={calculation}
                                isLoading={isBudgetLoading}
                                startDate={budget?.startDate}
                                endDate={budget?.endDate}
                                variant={budget?.widgetVariant}
                                budgetId={budget?.id}
                            />
                        </View>
                    }
                />
            ) : (
                <View className="flex-1 px-5xl" style={emptyStateStyle}>
                    <BudgetWidget
                        calculation={calculation}
                        isLoading={isBudgetLoading}
                        startDate={budget?.startDate}
                        endDate={budget?.endDate}
                        variant={budget?.widgetVariant}
                        budgetId={budget?.id}
                    />
                    <AccountsEmptyState />
                </View>
            )}
        </View>
    );
}
