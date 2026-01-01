import { BudgetAllocationEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../../@generic/component/card/card';
import { EmptyScreen } from '../../../../@generic/component/empty-screen/empty-screen';
import { HapticPressable } from '../../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../../@generic/component/icon/icon';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { cn } from '../../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../../@generic/utils/go-back-or-replace.util';
import { BudgetProgressBar } from '../../../../budget/component/budget-progress-bar/budget-progress-bar';
import { useBudgetStats } from '../../../../budget/hook/use-budget-stats.hook';
import { useCategoryStats } from '../../../../budget/hook/use-category-stats.hook';
import { useGetBudgetAllocationsQuery } from '../../../../budget/query/use-get-budget-allocations.query';
import { useGetBudgetByIdQuery } from '../../../../budget/query/use-get-budget-by-id.query';
import { budgetService } from '../../../../budget/service/budget.service';
import { useAllCategoriesQuery } from '../../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../../instrument/query/use-get-instrument-by-id.query';

export default function BudgetDetails() {
    const { t } = useLingui();
    const params = useLocalSearchParams<IdParamInterface>();
    const id = Number(params.id);

    const { budget, isLoading } = useGetBudgetByIdQuery(id);
    const { allocations } = useGetBudgetAllocationsQuery(id);
    const { instrument } = useGetInstrumentByIdQuery(budget?.instrumentId ?? 0);
    const { categories } = useAllCategoriesQuery();

    const formatDigits = useFormatDigits(0);
    const currencySymbol = instrument?.symbol ?? '';

    const { totalSpent, totalIncome, totalPlanned, spendingByCategory, periodInfo } = useBudgetStats(budget, allocations);
    const { categoryStats, categoriesOverBudget } = useCategoryStats(allocations, categories, spendingByCategory, totalIncome);

    const handleGoBack = () => void goBackOrReplace('/');

    const handleAddAllocation = () => void router.push(`/budget/${id}/add-allocation`);

    const handleEditAllocation = (allocation: BudgetAllocationEntityInterface) =>
        void router.push(`/budget/${id}/allocation/${allocation.id}`);

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(budget)) {
        return <Redirect href="/" />;
    }

    const totalActual = totalSpent;
    const remaining = totalPlanned - totalActual;
    const isPositive = remaining >= 0;
    const safeToSpend = budgetService.calculateSafeToSpend(totalPlanned, totalActual, periodInfo.daysElapsed, periodInfo.totalDays);
    const dailyBudget = periodInfo.daysRemaining > 0 ? safeToSpend / periodInfo.daysRemaining : 0;

    const dailyBudgetFormatted = formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol);
    const totalPlannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const totalSpentFormatted = formatDigits(convertFromMicroUnits(totalActual), currencySymbol);
    const { daysRemaining, totalDays } = periodInfo;

    const safeToSpendClassName = cn('text-3xl font-bold', isPositive ? 'text-positive-foreground' : 'text-warning-foreground');
    const remainingClassName = cn('text-lg font-semibold', isPositive ? 'text-positive-foreground' : 'text-warning-foreground');

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
                    <Card className="gap-3" size="md">
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-xs text-secondary-foreground">
                                    <Trans>Safe to Spend</Trans>
                                </Text>
                                <Text className={safeToSpendClassName}>
                                    {formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol)}
                                </Text>
                                <Text className="text-xs text-secondary-foreground">{t`${dailyBudgetFormatted}/day`}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-xs text-secondary-foreground">
                                    <Trans>Remaining</Trans>
                                </Text>
                                <Text className={remainingClassName}>{formatDigits(convertFromMicroUnits(remaining), currencySymbol)}</Text>
                                <Text className="text-xs text-secondary-foreground">{t`of ${totalPlannedFormatted}`}</Text>
                            </View>
                        </View>

                        <BudgetProgressBar planned={totalPlanned} actual={totalActual} className="h-2" />

                        <View className="flex-row justify-between">
                            <Text className="text-xs text-secondary-foreground">{t`Spent: ${totalSpentFormatted}`}</Text>
                            <Text className="text-xs text-secondary-foreground">{t`${daysRemaining} of ${totalDays} days left`}</Text>
                        </View>

                        {categoriesOverBudget > 0 && (
                            <View className="flex-row items-center gap-1 pt-1">
                                <Icon icon="AlertTriangle" size={12} className="text-warning-foreground" />
                                <Text className="text-xs text-warning-foreground">{t`${categoriesOverBudget} categories over budget`}</Text>
                            </View>
                        )}
                    </Card>

                    <View className="gap-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs uppercase text-secondary-foreground">
                                <Trans>Categories</Trans>
                            </Text>
                            <HapticPressable className="flex-row items-center gap-1" onPress={handleAddAllocation}>
                                <Icon icon="Plus" size={14} className="text-primary" />
                                <Text className="text-xs text-primary">{t`Add`}</Text>
                            </HapticPressable>
                        </View>

                        {isNotEmptyArray(categoryStats) ? (
                            categoryStats.map(cat => {
                                const handlePress = () => void handleEditAllocation(cat.allocation);
                                const spentClassName = cn(
                                    'text-sm font-medium',
                                    cat.isOverBudget ? 'text-warning-foreground' : 'text-primary'
                                );
                                const remainingTextClassName = cn(
                                    'text-xs',
                                    cat.isOverBudget ? 'text-warning-foreground' : 'text-positive-foreground'
                                );
                                const percentageClassName = cn(
                                    'text-xs',
                                    cat.isOverBudget ? 'text-warning-foreground' : 'text-secondary-foreground'
                                );
                                const catSpentFormatted = formatDigits(convertFromMicroUnits(cat.spent), currencySymbol);
                                const catPlannedFormatted = formatDigits(convertFromMicroUnits(cat.planned), currencySymbol);
                                const catRemainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(cat.remaining)), currencySymbol);

                                return (
                                    <HapticPressable key={cat.allocation.id} onPress={handlePress}>
                                        <Card className="gap-2" size="sm">
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center gap-2 flex-1">
                                                    <Icon icon={cat.icon} size={16} className="text-secondary-foreground" />
                                                    <Text className="text-sm font-medium text-primary flex-1" numberOfLines={1}>
                                                        {cat.name}
                                                    </Text>
                                                </View>
                                                <Text className={spentClassName}>
                                                    {catSpentFormatted}
                                                    <Text className="text-xs text-secondary-foreground">{` / ${catPlannedFormatted}`}</Text>
                                                </Text>
                                            </View>

                                            <BudgetProgressBar planned={cat.planned} actual={cat.spent} className="h-1.5" />

                                            <View className="flex-row justify-between">
                                                <Text className={remainingTextClassName}>
                                                    {cat.isOverBudget
                                                        ? t`Over by ${catRemainingFormatted}`
                                                        : t`${catRemainingFormatted} left`}
                                                </Text>
                                                <Text className={percentageClassName}>{`${cat.percentage}%`}</Text>
                                            </View>
                                        </Card>
                                    </HapticPressable>
                                );
                            })
                        ) : (
                            <Card className="items-center py-6" size="md">
                                <Icon icon="Layers" size={32} className="text-secondary-foreground mb-2" />
                                <Text className="text-sm text-secondary-foreground">
                                    <Trans>No categories added yet</Trans>
                                </Text>
                                <HapticPressable className="mt-2" onPress={handleAddAllocation}>
                                    <Text className="text-sm text-primary">{t`Add Category`}</Text>
                                </HapticPressable>
                            </Card>
                        )}
                    </View>
                </View>
            </ScrollView>
        </Page>
    );
}
