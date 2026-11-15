import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { FLOATING_TAB_BAR_MIN_BOTTOM_INSET } from '../../@generic/constant/floating-tab-bar.constant';
import { SCREEN_CHROME_CONFIG } from '../../@generic/constant/screen-chrome-config.constant';
import { ScreenChromeStickyHeadersProvider } from '../../@generic/provider/screen-chrome-sticky-headers.provider';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { NetWorthCollapsibleHeader } from '../../account/component/net-worth-collapsible-header/net-worth-collapsible-header';
import { NetWorthComposition } from '../../account/component/net-worth-composition/net-worth-composition';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { AiDownloadHomeStatus } from '../../ai/component/ai-download-home-status/ai-download-home-status';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useIsOnboardingPending } from '../../onboarding/hook/use-is-onboarding-active.hook';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

const HOME_SCREEN_CHROME_CONFIG = {
    ...SCREEN_CHROME_CONFIG,
    headerHeight: 156,
    collapsedHeaderHeight: 44,
    collapseEnd: 112,
    smallTitleStart: 56,
    largeTitleEnd: 67.2
};

export default function HomePage() {
    const { activeAccountCount, balanceSummary, isLoading, sections } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const tabBarBottomInset = Math.max(bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET);
    const onboardingHref = useOnboardingRedirect();
    const isOnboardingPending = useIsOnboardingPending();

    if (isDefined(onboardingHref)) {
        return <Redirect href={onboardingHref} />;
    }

    if (isOnboardingPending) {
        return null;
    }

    const listHeaderComponent = (
        <View className="mb-lg gap-y-xl pt-xs">
            <View className="px-3xl">
                <NetWorthComposition sections={sections} />
            </View>
            <AiDownloadHomeStatus />
            <BudgetWidget />
        </View>
    );

    return (
        <ScreenChromeThemeProvider config={HOME_SCREEN_CHROME_CONFIG}>
            <GroupedSurface>
                <ScreenChromeStickyHeadersProvider>
                    <NetWorthCollapsibleHeader netWorth={balanceSummary.netWorth} isLoading={isLoading} />

                    <HomeSectionsList
                        sections={sections}
                        activeAccountCount={activeAccountCount}
                        isLoading={isLoading}
                        bottomInset={tabBarBottomInset}
                        balancesByAccountId={balanceSummary.balancesByAccountId}
                        listHeaderComponent={listHeaderComponent}
                    />
                </ScreenChromeStickyHeadersProvider>
            </GroupedSurface>
        </ScreenChromeThemeProvider>
    );
}
