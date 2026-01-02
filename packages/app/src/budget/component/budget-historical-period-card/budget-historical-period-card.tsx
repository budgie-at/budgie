import { UserIconNameEnum } from '@budgie/contracts';
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
import { HistoricalCategoryBreakdown } from '../historical-category-breakdown/historical-category-breakdown';
import { HistoricalPeriodStats } from '../historical-period-stats/historical-period-stats';

interface AllocationInfo {
    readonly categoryId: number;
    readonly amount: number;
}

interface Props {
    readonly label: string;
    readonly startDate: Date;
    readonly endDate: Date;
    readonly totalPlanned: number;
    readonly categoryIds: readonly number[];
    readonly currencySymbol: string;
    readonly allocations: readonly AllocationInfo[];
}

const MAX_CATEGORIES = 5;
const UNDER_BUDGET_THRESHOLD = 50;

export const BudgetHistoricalPeriodCard = (props: Props) => {
    const { label, startDate, endDate, categoryIds, totalPlanned, currencySymbol, allocations } = props;
    const formatDigits = useFormatDigits(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const { categories } = useAllCategoriesQuery();
    const { totalSpent } = useGetBudgetActualSpendingQuery({ categoryIds: [...categoryIds], startDate, endDate });
    const { spendingByCategory } = useGetSpendingByCategoryQuery({ categoryIds: [...categoryIds], startDate, endDate });

    const remaining = totalPlanned - totalSpent;
    const percentage = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOverBudget = totalSpent > totalPlanned;
    const statusIcon = isOverBudget ? 'AlertTriangle' : 'CheckCircle';
    const statusClassName = isOverBudget ? 'text-warning-foreground' : 'text-positive-foreground';

    const categoryStats = allocations.map(alloc => {
        const category = categories.find(cat => cat.id === alloc.categoryId);
        const spending = spendingByCategory.find(sp => sp.categoryId === alloc.categoryId);
        const spent = spending?.total ?? 0;
        const catPercentage = alloc.amount > 0 ? Math.round((spent / alloc.amount) * 100) : 0;
        const icon = category?.icon ?? UserIconNameEnum.Wallet;

        return { name: category?.title ?? '-', icon, spent, percentage: catPercentage, isOverBudget: spent > alloc.amount };
    });

    const overBudgetCount = categoryStats.filter(cat => cat.isOverBudget).length;
    const underBudgetCount = categoryStats.filter(cat => cat.percentage < UNDER_BUDGET_THRESHOLD).length;
    const displayCategories = categoryStats.slice(0, MAX_CATEGORIES).map(cat => ({ ...cat, spentFormatted: formatDigits(convertFromMicroUnits(cat.spent), currencySymbol) }));
    const handleToggle = () => void setIsExpanded(prev => !prev);
    const expandIcon = isExpanded ? 'ChevronDown' : 'ChevronRight';
    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(remaining)), currencySymbol);
    const savedFormatted = formatDigits(convertFromMicroUnits(remaining), currencySymbol);
    const plannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);

    return (
        <Card className="gap-2">
            <HapticPressable onPress={handleToggle}>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-medium text-primary">{label}</Text>
                        <Icon icon={expandIcon} size={14} className="text-secondary-foreground" />
                    </View>
                    <View className="flex-row items-center gap-1">
                        <Icon icon={statusIcon} size={12} className={statusClassName} />
                        <Text className={cn('text-xs', statusClassName)}>{percentage}%</Text>
                    </View>
                </View>
            </HapticPressable>
            <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-1.5" />
            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground"><Trans>Spent: {spentFormatted}</Trans></Text>
                <Text className={cn('text-xs', statusClassName)}>{isOverBudget ? <Trans>Over: {remainingFormatted}</Trans> : <Trans>Saved: {savedFormatted}</Trans>}</Text>
            </View>
            {isExpanded && (
                <View className="mt-2 pt-2 border-t border-secondary-corner gap-3">
                    <HistoricalPeriodStats categoriesCount={categoryStats.length} overBudgetCount={overBudgetCount} underBudgetCount={underBudgetCount} />
                    <View className="flex-row justify-between py-1">
                        <Text className="text-xs text-secondary-foreground"><Trans>Budget</Trans></Text>
                        <Text className="text-xs font-medium text-primary">{plannedFormatted}</Text>
                    </View>
                    <Text className="text-xs uppercase text-secondary-foreground"><Trans>Category Breakdown</Trans></Text>
                    <HistoricalCategoryBreakdown categories={displayCategories} remainingCount={Math.max(0, categoryStats.length - MAX_CATEGORIES)} />
                </View>
            )}
        </Card>
    );
};
