import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetCategoriesCard } from '../../../budget/components/budget-categories-card/budget-categories-card';
import { BudgetIncomeCard } from '../../../budget/components/budget-income-card/budget-income-card';
import { BudgetOverviewCard } from '../../../budget/components/budget-overview-card/budget-overview-card';
import { BudgetPeriodNavigator } from '../../../budget/components/budget-period-navigator/budget-period-navigator';
import { BudgetSettingsButton } from '../../../budget/components/budget-settings-button/budget-settings-button';
import { BudgetUnbudgetedCard } from '../../../budget/components/budget-unbudgeted-card/budget-unbudgeted-card';
import { useBudgetPeriodNavigation } from '../../../budget/hook/use-budget-period-navigation.hook';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../../budget/query/use-get-budget-calculation.query';

const SCROLL_VIEW_CONTENT_STYLE = { paddingBottom: 100 };

export default function BudgetDetailScreen() {
    const { t } = useLingui();

    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const periodNavigation = useBudgetPeriodNavigation(budget);
    const dateRangeOverride = { startDate: periodNavigation.startDate, endDate: periodNavigation.endDate };
    const { calculation, isLoading: isCalculationLoading } = useGetBudgetCalculationQuery(budget, dateRangeOverride);

    const handleGoBack = () => void goBackOrReplace('/');

    const isLoading = isBudgetLoading || isCalculationLoading || !isDefined(calculation);

    /* jscpd:ignore-start */
    if (isLoading) {
        return (
            <Page header={<PageHeader title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />}>
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
        <Page header={<PageHeader title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />}>
            <ScrollView className="flex-1" contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE}>
                <View className="gap-y-xl">
                    <BudgetPeriodNavigator
                        startDate={periodNavigation.startDate}
                        endDate={periodNavigation.endDate}
                        isCurrentPeriod={periodNavigation.isCurrentPeriod}
                        onPrevious={periodNavigation.handlePrevious}
                        onNext={periodNavigation.handleNext}
                    />
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
