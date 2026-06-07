import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { useFocusKey } from '../../@generic/hook/use-focus-key.hook';
import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { buildHomePageSections } from '../../account/utils/build-home-page-sections.util';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useSetting } from '../../settings/hook/use-setting.hook';

export default function HomePage() {
    const { accounts, balanceSummary } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const language = useSetting('language');
    const isBudgetWidgetEnabled = useSetting('isBudgetWidgetEnabled');
    const focusKey = useFocusKey();

    const scrollY = useSharedValue(0);
    const activeAccounts = accounts.filter(account => account.isActive);
    const sections = buildHomePageSections(activeAccounts);
    const budgetWidgetRemountKey = `${language}-${isBudgetWidgetEnabled ? 'enabled' : 'disabled'}-${focusKey}`;
    // Remount the widget on key settings changes: the frozen Home tab plus the memoized list header otherwise keeps stale content.
    const listHeaderComponent = (
        <View className="mb-3xl">
            <BudgetWidget key={budgetWidgetRemountKey} />
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <CollapsibleHeader
                scrollY={scrollY}
                netWorth={balanceSummary.netWorth}
                fiatTotal={balanceSummary.fiatTotal}
                cryptoTotal={balanceSummary.cryptoTotal}
                fiatCount={balanceSummary.fiatCount}
                cryptoCount={balanceSummary.cryptoCount}
            />

            <HomeSectionsList
                scrollY={scrollY}
                sections={sections}
                activeAccountCount={activeAccounts.length}
                bottomInset={bottom}
                balanceSummary={balanceSummary}
                listHeaderComponent={listHeaderComponent}
            />
        </View>
    );
}
