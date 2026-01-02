/* eslint-disable lingui/no-expression-in-message, max-lines-per-function, @rnw-community/no-complex-jsx-logic */
import { BudgetEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useBudgetStats } from '../../hook/use-budget-stats.hook';
import { useCategoryStats } from '../../hook/use-category-stats.hook';
import { useGetBudgetAllocationsQuery } from '../../query/use-get-budget-allocations.query';
import { budgetService } from '../../service/budget.service';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetHomeWidget = ({ budget }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';

    const { totalSpent, totalIncome, totalPlanned, remaining, spendingByCategory, periodInfo } = useBudgetStats(budget, allocations);
    const { categoryStats, categoriesOverBudget } = useCategoryStats(allocations, categories, spendingByCategory, totalIncome);

    const topCategories = useMemo(
        () => [...categoryStats].sort((first, second) => second.spent - first.spent).slice(0, 3),
        [categoryStats]
    );

    const totalActual = totalSpent;
    const isPositive = remaining >= 0;

    const safeToSpend = budgetService.calculateSafeToSpend(
        totalPlanned,
        totalActual,
        periodInfo.daysElapsed,
        periodInfo.totalDays
    );

    const dailyBudget = periodInfo.daysRemaining > 0 ? safeToSpend / periodInfo.daysRemaining : 0;
    const { daysRemaining } = periodInfo;

    const handlePress = () => void router.push(`/budget/${budget.id}`);

    const safeToSpendClassName = cn('text-2xl font-bold', isPositive ? 'text-positive-foreground' : 'text-warning-foreground');
    const remainingClassName = cn('text-sm font-semibold', isPositive ? 'text-positive-foreground' : 'text-warning-foreground');

    return (
        <HapticPressable onPress={handlePress}>
            <Card className="gap-3" size="md">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Icon icon="Wallet" size={18} className="text-primary" />
                        <Text className="text-sm font-semibold text-primary">{budget.title}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-secondary-foreground">{t`${daysRemaining}d left`}</Text>
                        <Icon icon="ChevronRight" size={16} className="text-secondary-foreground" />
                    </View>
                </View>

                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Safe to Spend</Trans>
                        </Text>
                        <Text className={safeToSpendClassName}>
                            {formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol)}
                        </Text>
                        <Text className="text-xs text-secondary-foreground">
                            {t`${formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol)}/day`}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Remaining</Trans>
                        </Text>
                        <Text className={remainingClassName}>
                            {formatDigits(convertFromMicroUnits(remaining), currencySymbol)}
                        </Text>
                        <Text className="text-xs text-secondary-foreground">
                            {t`of ${formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol)}`}
                        </Text>
                    </View>
                </View>

                <BudgetProgressBar planned={totalPlanned} actual={totalActual} className="h-2" />

                <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-secondary-foreground">
                        {t`Spent: ${formatDigits(convertFromMicroUnits(totalActual), currencySymbol)}`}
                    </Text>
                    {categoriesOverBudget > 0 ? (
                        <View className="flex-row items-center gap-1">
                            <Icon icon="AlertTriangle" size={12} className="text-warning-foreground" />
                            <Text className="text-xs text-warning-foreground">
                                {t`${categoriesOverBudget} over budget`}
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-xs text-positive-foreground">
                            <Trans>On track</Trans>
                        </Text>
                    )}
                </View>

                {topCategories.length > 0 && (
                    <View className="gap-2 pt-1 border-t border-secondary-corner">
                        <Text className="text-xs text-secondary-foreground pt-2">
                            <Trans>Top Spending</Trans>
                        </Text>
                        {topCategories.map(cat => {
                            const percentage = cat.planned > 0 ? Math.round((cat.spent / cat.planned) * 100) : 0;
                            const percentageText = `${percentage}%`;
                            const spentTextClassName = cn('text-xs', cat.isOverBudget ? 'text-warning-foreground' : 'text-primary');

                            return (
                                <View key={cat.name} className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2 flex-1">
                                        <Icon icon={cat.icon} size={14} className="text-secondary-foreground" />
                                        <Text className="text-xs text-primary flex-1" numberOfLines={1}>
                                            {cat.name}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Text className={spentTextClassName}>
                                            {formatDigits(convertFromMicroUnits(cat.spent), currencySymbol)}
                                        </Text>
                                        <Text className={cn('text-xs w-10 text-right', cat.isOverBudget ? 'text-warning-foreground' : 'text-secondary-foreground')}>
                                            {percentageText}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </Card>
        </HapticPressable>
    );
};
