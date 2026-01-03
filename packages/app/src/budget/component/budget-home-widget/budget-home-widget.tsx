import { BudgetEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAllCategoriesQuery } from '../../../category/query/use-all-categories.query';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { useBudgetStats } from '../../hook/use-budget-stats.hook';
import { useCategoryStats } from '../../hook/use-category-stats.hook';
import { useGetBudgetAllocationsQuery } from '../../query/use-get-budget-allocations.query';
import { budgetService } from '../../service/budget.service';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { WidgetAmounts } from '../widget-amounts/widget-amounts';
import { WidgetHeader } from '../widget-header/widget-header';
import { WidgetStatusIndicator } from '../widget-status-indicator/widget-status-indicator';
import { WidgetTopSpending } from '../widget-top-spending/widget-top-spending';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetHomeWidget = ({ budget }: Props) => {
    const formatDigits = useFormatDigits(0);
    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';
    const { totalSpent, totalIncome, totalPlanned, remaining, spendingByCategory, periodInfo } = useBudgetStats(budget, allocations);
    const { categoryStats, categoriesOverBudget } = useCategoryStats(allocations, categories, spendingByCategory, totalIncome);

    const topCategories = [...categoryStats]
        .sort((first, second) => second.spent - first.spent)
        .slice(0, 3)
        .map(category => ({
            name: category.name,
            icon: category.icon,
            spentFormatted: formatDigits(convertFromMicroUnits(category.spent), currencySymbol),
            percentage: isPositiveNumber(category.planned) ? Math.round((category.spent / category.planned) * 100) : 0,
            isOverBudget: category.isOverBudget
        }));

    const safeToSpend = budgetService.calculateSafeToSpend(totalPlanned, totalSpent, periodInfo.daysElapsed, periodInfo.totalDays);
    const dailyBudget = isPositiveNumber(periodInfo.daysRemaining) ? safeToSpend / periodInfo.daysRemaining : 0;
    const handlePress = () => void router.push(`/budget/${budget.id}`);

    const isPositive = safeToSpend >= 0;
    const safeToSpendFormatted = formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol);
    const safeToSpendPerDayFormatted = formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(remaining), currencySymbol);
    const totalFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);

    return (
        <HapticPressable onPress={handlePress}>
            <Card className="gap-3" size="md">
                <WidgetHeader title={budget.title} daysRemaining={periodInfo.daysRemaining} />

                <WidgetAmounts
                    safeToSpendFormatted={safeToSpendFormatted}
                    safeToSpendPerDayFormatted={safeToSpendPerDayFormatted}
                    remainingFormatted={remainingFormatted}
                    totalFormatted={totalFormatted}
                    isPositive={isPositive}
                />

                <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />

                <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Spent: {spentFormatted}</Trans>
                    </Text>
                    <WidgetStatusIndicator categoriesOverBudget={categoriesOverBudget} />
                </View>

                {isNotEmptyArray(topCategories) && <WidgetTopSpending categories={topCategories} />}
            </Card>
        </HapticPressable>
    );
};
