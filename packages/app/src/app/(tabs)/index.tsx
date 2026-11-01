import { AccountTypeEnum } from '@budgie/contracts';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../@generic/provider/screen-chrome-theme.provider';
import { CashCard } from '../../account/component/cash-card/cash-card';
import { HomeSectionsList } from '../../account/component/home-sections-list/home-sections-list';
import { NetWorthCollapsibleHeader } from '../../account/component/net-worth-collapsible-header/net-worth-collapsible-header';
import { NetWorthComposition } from '../../account/component/net-worth-composition/net-worth-composition';
import { useHomePageDataQuery } from '../../account/query/use-home-page-data.query';
import { AiDownloadHomeStatus } from '../../ai/component/ai-download-home-status/ai-download-home-status';
import { BudgetWidget } from '../../budget/components/budget-widget/budget-widget';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

export default function HomePage() {
    const { activeAccountCount, balanceSummary, cashAccounts, isLoading, sections } = useHomePageDataQuery();
    const { bottom } = useSafeAreaInsets();
    const onboardingHref = useOnboardingRedirect();

    if (isDefined(onboardingHref)) {
        return <Redirect href={onboardingHref} />;
    }

    const listHeaderComponent = (
        <View className="mb-lg gap-y-xl pt-xs">
            <View className="px-3xl">
                <NetWorthComposition sections={sections} cashTotal={balanceSummary.accountTypeTotals.get(AccountTypeEnum.CASH) ?? 0} />
            </View>
            <AiDownloadHomeStatus />
            <BudgetWidget />
            <CashCard
                accounts={cashAccounts}
                total={balanceSummary.accountTypeTotals.get(AccountTypeEnum.CASH) ?? 0}
                balancesByAccountId={balanceSummary.balancesByAccountId}
            />
        </View>
    );

    return (
        <ScreenChromeThemeProvider>
            <GroupedSurface>
                <NetWorthCollapsibleHeader netWorth={balanceSummary.netWorth} isLoading={isLoading} />

                <HomeSectionsList
                    sections={sections}
                    activeAccountCount={activeAccountCount}
                    isLoading={isLoading}
                    bottomInset={bottom}
                    balanceSummary={balanceSummary}
                    listHeaderComponent={listHeaderComponent}
                />
            </GroupedSurface>
        </ScreenChromeThemeProvider>
    );
}
