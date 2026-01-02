import { Trans } from '@lingui/react/macro';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../../@generic/component/card/card';
import { EmptyScreen } from '../../../../@generic/component/empty-screen/empty-screen';
import { HapticPressable } from '../../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../../@generic/component/icon/icon';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetCategoriesHeader } from '../../../../budget/component/budget-categories-header/budget-categories-header';
import { BudgetCategoryItem } from '../../../../budget/component/budget-category-item/budget-category-item';
import { BudgetDetailsSummaryCard } from '../../../../budget/component/budget-details-summary-card/budget-details-summary-card';
import { useBudgetStats } from '../../../../budget/hook/use-budget-stats.hook';
import { useCategoryStats } from '../../../../budget/hook/use-category-stats.hook';
import { useGetBudgetAllocationsQuery } from '../../../../budget/query/use-get-budget-allocations.query';
import { useGetBudgetByIdQuery } from '../../../../budget/query/use-get-budget-by-id.query';
import { budgetService } from '../../../../budget/service/budget.service';
import { useAllCategoriesQuery } from '../../../../category/query/use-all-categories.query';
import { useGetInstrumentByIdQuery } from '../../../../instrument/query/use-get-instrument-by-id.query';

export default function BudgetDetails() {
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { budget, isLoading } = useGetBudgetByIdQuery(id);
    const { allocations } = useGetBudgetAllocationsQuery(id);
    const { instrument } = useGetInstrumentByIdQuery(budget?.instrumentId ?? 0);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';
    const { totalSpent, totalIncome, totalPlanned, spendingByCategory, periodInfo } = useBudgetStats(budget, allocations);
    const { categoryStats, categoriesOverBudget } = useCategoryStats(allocations, categories, spendingByCategory, totalIncome);

    const handleGoBack = () => void goBackOrReplace('/');
    const handleAddAllocation = () => void router.push(`/budget/${id}/add-allocation`);

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/" />;
    }

    const remaining = totalPlanned - totalSpent;
    const safeToSpend = budgetService.calculateSafeToSpend(totalPlanned, totalSpent, periodInfo.daysElapsed, periodInfo.totalDays);
    const dailyBudget = isPositiveNumber(periodInfo.daysRemaining) ? safeToSpend / periodInfo.daysRemaining : 0;

    return (
        <Page
            header={
                <PageHeader
                    icon="Wallet"
                    onGoBack={handleGoBack}
                    title={budget.title}
                    iconVariant="ghost"
                    right={
                        <HapticPressable hitSlop={10} onPress={handleAddAllocation}>
                            <Icon icon="Plus" size={20} className="text-primary" />
                        </HapticPressable>
                    }
                />
            }
        >
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="gap-4 py-4">
                    <BudgetDetailsSummaryCard
                        safeToSpend={safeToSpend}
                        dailyBudget={dailyBudget}
                        remaining={remaining}
                        totalPlanned={totalPlanned}
                        totalSpent={totalSpent}
                        daysRemaining={periodInfo.daysRemaining}
                        totalDays={periodInfo.totalDays}
                        categoriesOverBudget={categoriesOverBudget}
                        currencySymbol={currencySymbol}
                    />
                    <View className="gap-3">
                        <BudgetCategoriesHeader onAdd={handleAddAllocation} />

                        {isNotEmptyArray(categoryStats) ? (
                            categoryStats.map(cat => (
                                <BudgetCategoryItem
                                    key={cat.allocation.id}
                                    budgetId={id}
                                    allocationId={cat.allocation.id}
                                    name={cat.name}
                                    icon={cat.icon}
                                    spent={cat.spent}
                                    planned={cat.planned}
                                    remaining={cat.remaining}
                                    percentage={cat.percentage}
                                    isOverBudget={cat.isOverBudget}
                                    currencySymbol={currencySymbol}
                                />
                            ))
                        ) : (
                            <Card className="items-center py-6" size="md">
                                <Icon icon="Layers" size={32} className="text-secondary-foreground mb-2" />
                                <Text className="text-sm text-secondary-foreground">
                                    <Trans>No categories added yet</Trans>
                                </Text>
                            </Card>
                        )}
                    </View>
                </View>
            </ScrollView>
        </Page>
    );
}
