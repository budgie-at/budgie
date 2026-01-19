import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetAlertBanner } from '../../../budget/components/budget-alert-banner/budget-alert-banner';
import { BudgetCategoriesCard } from '../../../budget/components/budget-categories-card/budget-categories-card';
import { BudgetIncomeCard } from '../../../budget/components/budget-income-card/budget-income-card';
import { BudgetOverviewCard } from '../../../budget/components/budget-overview-card/budget-overview-card';
import { BudgetPeriodNavigator } from '../../../budget/components/budget-period-navigator/budget-period-navigator';
import { BudgetSettingsButton } from '../../../budget/components/budget-settings-button/budget-settings-button';
import { BudgetUnbudgetedCard } from '../../../budget/components/budget-unbudgeted-card/budget-unbudgeted-card';
import { BudgetStatusEnum } from '../../../budget/enum/budget-status.enum';
import { useBudgetPeriodNavigation } from '../../../budget/hook/use-budget-period-navigation.hook';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../../budget/query/use-get-budget-calculation.query';

const SCROLL_VIEW_CONTENT_STYLE = { paddingTop: 60, paddingBottom: 100 };

export default function BudgetDetailScreen() {
    const { t } = useLingui();

    const [isBannerDismissed, setIsBannerDismissed] = useState(false);

    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const periodNavigation = useBudgetPeriodNavigation(budget);
    const {
        calculation,
        isLoading: isCalculationLoading,
        error
    } = useGetBudgetCalculationQuery(budget, {
        startDate: periodNavigation.startDate,
        endDate: periodNavigation.endDate
    });

    const handleGoBack = () => void goBackOrReplace('/');
    const handleDismissBanner = () => void setIsBannerDismissed(true);

    const isLoading = isBudgetLoading || isCalculationLoading || !isDefined(calculation);
    const isOverBudget = !isLoading && calculation.overallStatus === BudgetStatusEnum.OVER;
    const bannerMessage = isOverBudget ? t`You've exceeded your budget limit` : t`You're approaching your budget limit`;
    const bannerSeverity = isOverBudget ? 'destructive' : 'warning';
    const shouldShowBanner = !isLoading && !isBannerDismissed && calculation.overallStatus !== BudgetStatusEnum.ON_TRACK;

    const errorMessage = isNotEmptyString(error?.message) ? error.message : t`An error occurred`;

    /* jscpd:ignore-start */
    if (isDefined(error)) {
        return (
            <Page header={<PageHeader className="border-b-0" title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />} withBlur>
                {isDefined(budget) ? (
                    <BudgetPeriodNavigator
                        startDate={periodNavigation.startDate}
                        endDate={periodNavigation.endDate}
                        isCurrentPeriod={periodNavigation.isCurrentPeriod}
                        onPrevious={periodNavigation.handlePrevious}
                        onNext={periodNavigation.handleNext}
                    />
                ) : null}
                <View className="flex-1 items-center justify-center gap-y-md">
                    <Text className="text-destructive-foreground font-medium">
                        <Trans>Failed to load budget</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">{errorMessage}</Text>
                </View>
            </Page>
        );
    }

    if (isLoading) {
        return (
            <Page header={<PageHeader className="border-b-0" title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />} withBlur>
                {isDefined(budget) ? (
                    <BudgetPeriodNavigator
                        startDate={periodNavigation.startDate}
                        endDate={periodNavigation.endDate}
                        isCurrentPeriod={periodNavigation.isCurrentPeriod}
                        onPrevious={periodNavigation.handlePrevious}
                        onNext={periodNavigation.handleNext}
                    />
                ) : null}
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    return (
        <Page header={<PageHeader className="border-b-0" title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />} withBlur>
            <ScrollView className="flex-1" contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE} showsVerticalScrollIndicator={false}>
                <View className="gap-y-xl">
                    <BudgetPeriodNavigator
                        startDate={periodNavigation.startDate}
                        endDate={periodNavigation.endDate}
                        isCurrentPeriod={periodNavigation.isCurrentPeriod}
                        onPrevious={periodNavigation.handlePrevious}
                        onNext={periodNavigation.handleNext}
                    />
                    {shouldShowBanner ? (
                        <BudgetAlertBanner message={bannerMessage} severity={bannerSeverity} onDismiss={handleDismissBanner} />
                    ) : null}
                    <BudgetOverviewCard calculation={calculation} />
                    {isNotEmptyArray(calculation.incomeStatuses) ? (
                        <BudgetIncomeCard
                            incomeStatuses={calculation.incomeStatuses}
                            totalActual={calculation.totalActualIncome}
                            totalExpected={calculation.totalExpectedIncome}
                        />
                    ) : null}
                    <BudgetCategoriesCard categoryStatuses={calculation.categoryStatuses} />
                    {isNotEmptyArray(calculation.unbudgetedSpending) ? (
                        <BudgetUnbudgetedCard
                            unbudgetedSpending={calculation.unbudgetedSpending}
                            totalUnbudgetedSpent={calculation.totalUnbudgetedSpent}
                        />
                    ) : null}
                </View>
            </ScrollView>
        </Page>
    );
    /* jscpd:ignore-end */
}
