import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useBudgetStats } from '../../hook/use-budget-stats.hook';
import { useCategoryStats } from '../../hook/use-category-stats.hook';
import { useGetBudgetAllocationsQuery } from '../../query/use-get-budget-allocations.query';
import { budgetService } from '../../service/budget.service';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';
import { cva } from 'class-variance-authority';

interface Props {
    readonly budget: BudgetEntityInterface;
}

const safeToSpendClassName = cva('text-2xl font-bold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

const remainingClassName = cva('text-sm font-semibold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

const percentageVariants = cva('text-xs w-10 text-right', {
    variants: {
        isOverBudget: {
            true: 'text-warning-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

const spentVariants = cva('text-xs', {
    variants: {
        isOverBudget: {
            true: 'text-warning-foreground',
            false: 'text-primary'
        }
    }
});

export const BudgetHomeWidget = ({ budget }: Props) => {
    const formatDigits = useFormatDigits(0);

    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';

    const { totalSpent, totalIncome, totalPlanned, remaining, spendingByCategory, periodInfo } = useBudgetStats(budget, allocations);
    const { categoryStats, categoriesOverBudget } = useCategoryStats(allocations, categories, spendingByCategory, totalIncome);

    const topCategories = [...categoryStats].sort((first, second) => second.spent - first.spent).slice(0, 3);

    const safeToSpend = budgetService.calculateSafeToSpend(totalPlanned, totalSpent, periodInfo.daysElapsed, periodInfo.totalDays);

    const dailyBudget = isPositiveNumber(periodInfo.daysRemaining) ? safeToSpend / periodInfo.daysRemaining : 0;
    const { daysRemaining } = periodInfo;

    const handlePress = () => void router.push(`/budget/${budget.id}`);

    const safeToSpendPerDay = formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol);
    const totalFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);

    return (
        <HapticPressable onPress={handlePress}>
            <Card className="gap-3" size="md">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Icon icon={UserIconNameEnum.Wallet} size={18} className="text-primary" />
                        <Text className="text-sm font-semibold text-primary">{budget.title}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>{daysRemaining}d left</Trans>
                        </Text>
                        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
                    </View>
                </View>

                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Safe to Spend</Trans>
                        </Text>
                        <Text className={safeToSpendClassName({ isPositive: safeToSpend >= 0 })}>
                            {formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol)}
                        </Text>
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>{safeToSpendPerDay}/day</Trans>
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Remaining</Trans>
                        </Text>
                        <Text className={remainingClassName({ isPositive: safeToSpend >= 0 })}>
                            {formatDigits(convertFromMicroUnits(remaining), currencySymbol)}
                        </Text>
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>of {totalFormatted}</Trans>
                        </Text>
                    </View>
                </View>

                <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />

                <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Spent: {spentFormatted}</Trans>
                    </Text>

                    {isPositiveNumber(categoriesOverBudget) ? (
                        <View className="flex-row items-center gap-1">
                            <Icon icon={UserIconNameEnum.AlertTriangle} size={12} className="text-warning-foreground" />
                            <Text className="text-xs text-warning-foreground">
                                <Trans>{categoriesOverBudget} over budget</Trans>
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-xs text-positive-foreground">
                            <Trans>On track</Trans>
                        </Text>
                    )}
                </View>

                {isNotEmptyArray(topCategories) && (
                    <View className="gap-2 pt-1 border-t border-secondary-corner">
                        <Text className="text-xs text-secondary-foreground pt-2">
                            <Trans>Top Spending</Trans>
                        </Text>
                        {topCategories.map(category => {
                            const percentage = isPositiveNumber(category.planned)
                                ? Math.round((category.spent / category.planned) * 100)
                                : 0;

                            return (
                                <View key={category.name} className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2 flex-1">
                                        <Icon icon={category.icon} size={14} className="text-secondary-foreground" />
                                        <Text className="text-xs text-primary flex-1" numberOfLines={1}>
                                            {category.name}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <Text className={spentVariants({ isOverBudget: category.isOverBudget })}>
                                            {formatDigits(convertFromMicroUnits(category.spent), currencySymbol)}
                                        </Text>
                                        <Text className={percentageVariants({ isOverBudget: category.isOverBudget })}>{percentage}%</Text>
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
