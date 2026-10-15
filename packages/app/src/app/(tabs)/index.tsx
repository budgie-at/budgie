import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { NetWorthCollapsibleHeader } from '../../account/component/net-worth-collapsible-header/net-worth-collapsible-header';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { AiDownloadHomeStatus } from '../../ai/component/ai-download-home-status/ai-download-home-status';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

export default function HomePage() {
    const { activeAccountCount, balanceSummary, sections } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const scrollY = useSharedValue(0);
    const onboardingHref = useOnboardingRedirect();

    if (isDefined(onboardingHref)) {
        return <Redirect href={onboardingHref} />;
    }

    const listHeaderComponent = (
        <View className="mb-3xl gap-y-3xl">
            <AiDownloadHomeStatus />
            <BudgetWidget />
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <NetWorthCollapsibleHeader
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
                activeAccountCount={activeAccountCount}
                bottomInset={bottom}
                balanceSummary={balanceSummary}
                listHeaderComponent={listHeaderComponent}
            />
        </View>
    );
}
