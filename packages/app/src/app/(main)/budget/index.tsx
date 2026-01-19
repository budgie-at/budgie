import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetCategoriesCard } from '../../../budget/components/budget-categories-card/budget-categories-card';
import { BudgetIncomeCard } from '../../../budget/components/budget-income-card/budget-income-card';
import { BudgetOverviewCard } from '../../../budget/components/budget-overview-card/budget-overview-card';
import { BudgetSettingsButton } from '../../../budget/components/budget-settings-button/budget-settings-button';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from '../../../budget/query/use-get-budget-calculation.query';

const SCROLL_VIEW_CONTENT_STYLE = { paddingBottom: 100 };

export default function BudgetDetailScreen() {
    const { t } = useLingui();
    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const { calculation, isLoading: isCalculationLoading } = useGetBudgetCalculationQuery(budget);

    const handleGoBack = () => void goBackOrReplace('/');

    if (isBudgetLoading || isCalculationLoading || !isDefined(calculation)) {
        return (
            <Page header={<PageHeader title={t`Budget`} onGoBack={handleGoBack} right={<BudgetSettingsButton />} />}>
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
                    <BudgetOverviewCard calculation={calculation} />
                    {isNotEmptyArray(calculation.incomeStatuses) ? (
                        <BudgetIncomeCard
                            incomeStatuses={calculation.incomeStatuses}
                            totalActual={calculation.totalActualIncome}
                            totalExpected={calculation.totalExpectedIncome}
                        />
                    ) : null}
                    <BudgetCategoriesCard categoryStatuses={calculation.categoryStatuses} />
                </View>
            </ScrollView>
        </Page>
    );
}
