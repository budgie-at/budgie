import { BudgetAllocationEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetBudgetActualSpendingQuery } from '../../query/use-get-budget-actual-spending.query';
import { useGetSpendingByCategoryQuery } from '../../query/use-get-spending-by-category.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly totalPlanned: number;
    readonly categoryIds: number[];
    readonly currencySymbol: string;
    readonly allocations: BudgetAllocationEntityInterface[];
}

export const BudgetHistoricalPeriodCard = (props: Props) => {
    const { label, startDate, endDate, categoryIds, totalPlanned, currencySymbol, allocations } = props;
    const formatDigits = useFormatDigits(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const { categories } = useAllCategoriesQuery();

    const { totalSpent } = useGetBudgetActualSpendingQuery({
        categoryIds,
        startDate,
        endDate
    });

    const { spendingByCategory } = useGetSpendingByCategoryQuery({
        categoryIds,
        startDate,
        endDate
    });

    const remaining = totalPlanned - totalSpent;
    const percentage = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOverBudget = totalSpent > totalPlanned;

    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(remaining)), currencySymbol);
    const plannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);

    const statusIcon = isOverBudget ? 'AlertTriangle' : 'CheckCircle';
    const statusClassName = isOverBudget ? 'text-warning-foreground' : 'text-positive-foreground';

    const categoryStats = allocations.map(allocation => {
        const category = categories.find(cat => cat.id === allocation.categoryId);
        const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
        const spent = spending?.total ?? 0;
        const planned = allocation.amount;
        const catRemaining = planned - spent;
        const catPercentage = planned > 0 ? Math.round((spent / planned) * 100) : 0;

        return {
            name: category?.title ?? '-',
            icon: category?.icon ?? UserIconNameEnum.Wallet,
            spent,
            planned,
            remaining: catRemaining,
            percentage: catPercentage,
            isOverBudget: spent > planned
        };
    });

    const overBudgetCount = categoryStats.filter(cat => cat.isOverBudget).length;
    const underBudgetCount = categoryStats.filter(cat => cat.percentage < 50 && cat.planned > 0).length;

    const remainingCategoriesCount = categoryStats.length - 5;

    const handleToggle = () => void setIsExpanded(prev => !prev);

    const expandedIcon = isExpanded ? 'ChevronDown' : 'ChevronRight';

    return (
        <Card className="gap-2">
            <HapticPressable onPress={handleToggle}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-medium text-primary">{label}</Text>
                        <Icon icon={expandedIcon} size={14} className="text-secondary-foreground" />
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Icon icon={statusIcon} size={12} className={statusClassName} />
                        <Text className={cn('text-xs', statusClassName)}>{`${percentage}%`}</Text>
                    </View>
                </View>
            </HapticPressable>

            <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-1.5" />

            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Spent: {spentFormatted}</Trans>
                </Text>
                <Text className={cn('text-xs', statusClassName)}>
                    {isOverBudget ? <Trans>Over: {remainingFormatted}</Trans> : <Trans>Saved: {remainingFormatted}</Trans>}
                </Text>
            </View>

            {isExpanded && (
                <View className="mt-2 pt-2 border-t border-secondary-corner gap-3">
                    <View className="flex-row justify-between">
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-bold text-primary">{categoryStats.length}</Text>
                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Categories</Trans>
                            </Text>
                        </View>
                        <View className="flex-1 items-center">
                            <Text
                                className={cn(
                                    'text-lg font-bold',
                                    overBudgetCount > 0 ? 'text-warning-foreground' : 'text-positive-foreground'
                                )}
                            >
                                {overBudgetCount}
                            </Text>
                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Over</Trans>
                            </Text>
                        </View>
                        <View className="flex-1 items-center">
                            <Text className="text-lg font-bold text-positive-foreground">{underBudgetCount}</Text>
                            <Text className="text-xs text-secondary-foreground">
                                <Trans>Under 50%</Trans>
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between py-1">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Budget</Trans>
                        </Text>
                        <Text className="text-xs font-medium text-primary">{plannedFormatted}</Text>
                    </View>

                    <Text className="text-xs uppercase text-secondary-foreground">
                        <Trans>Category Breakdown</Trans>
                    </Text>
                    {categoryStats.slice(0, 5).map(cat => {
                        const catSpent = formatDigits(convertFromMicroUnits(cat.spent), currencySymbol);
                        const catClassName = cat.isOverBudget ? 'text-warning-foreground' : 'text-primary';

                        return (
                            <View key={cat.name} className="flex-row items-center gap-2">
                                <Icon icon={cat.icon} size={12} className="text-secondary-foreground" />
                                <Text className="flex-1 text-xs text-primary" numberOfLines={1}>
                                    {cat.name}
                                </Text>
                                <Text className={cn('text-xs font-medium', catClassName)}>{catSpent}</Text>
                                <Text className="text-xs text-secondary-foreground w-8 text-right">{`${cat.percentage}%`}</Text>
                            </View>
                        );
                    })}
                    {categoryStats.length > 5 && (
                        <Text className="text-xs text-secondary-foreground text-center">
                            <Trans>+{remainingCategoriesCount} more categories</Trans>
                        </Text>
                    )}
                </View>
            )}
        </Card>
    );
};
