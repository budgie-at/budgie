import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollapsibleHeader } from '../../@generic/component/collapsible-header/collapsible-header';
import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { useAccountsWithBankSyncQuery } from '../../account/query/use-accounts-with-bank-sync.query';
import { useHomeAccountBalancesQuery } from '../../account/query/use-home-account-balances.query';
import { buildHomePageSections } from '../../account/utils/build-home-page-sections.util';

export default function HomePage() {
    const { accounts } = useAccountsWithBankSyncQuery();
    const balanceSummary = useHomeAccountBalancesQuery();
    const { bottom } = useSafeAreaInsets();

    const scrollY = useSharedValue(0);
    const activeAccounts = accounts.filter(account => account.isActive);
    const sections = buildHomePageSections(activeAccounts);

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
            />
        </View>
    );
}
