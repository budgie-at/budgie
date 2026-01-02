import { BudgetEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useBudgetAnalytics } from '../../hook/use-budget-analytics.hook';
import { BudgetHealthCard } from '../budget-health-card/budget-health-card';
import { BudgetHistoricalPeriods } from '../budget-historical-periods/budget-historical-periods';
import { BudgetOverviewCard } from '../budget-overview-card/budget-overview-card';
import { BudgetPlanNextPeriod } from '../budget-plan-next-period/budget-plan-next-period';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { BudgetStatsCards } from '../budget-stats-cards/budget-stats-cards';
import { BudgetSummaryCard } from '../budget-summary-card/budget-summary-card';
import { TopCategoriesCard } from '../top-categories-card/top-categories-card';

interface Props {
    readonly budget: BudgetEntityInterface;
}

const TOP_CATEGORIES_COUNT = 5;

export const BudgetAnalyticsContent = ({ budget }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    const analytics = useBudgetAnalytics(budget);

    const {
        allocations,
        currencySymbol,
        categoryIds,
        periodDates,
        historicalPeriods,
        totalSpent,
        periodInfo,
        totalPlanned,
        categoryStats,
        remaining,
        spentPercent,
        isOnTrack,
        dailyAverage,
        projectedSpend,
        overBudgetCount,
        underBudgetCount
    } = analytics;

    const topCategories = [...categoryStats]
        .sort((first, second) => second.spent - first.spent)
        .slice(0, TOP_CATEGORIES_COUNT)
        .map(cat => ({
            name: cat.name,
            icon: cat.icon,
            spentFormatted: formatDigits(convertFromMicroUnits(cat.spent), currencySymbol),
            percentage: cat.percentage,
            isOverBudget: cat.isOverBudget
        }));

    const spentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(remaining)), currencySymbol);
    const dailyFormatted = formatDigits(convertFromMicroUnits(dailyAverage), currencySymbol);
    const projectedFormatted = formatDigits(convertFromMicroUnits(projectedSpend), currencySymbol);
    const plannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);

    const statusLabel = isOnTrack ? t`On Track` : t`Over Pace`;
    const remainingLabel = remaining >= 0 ? t`Remaining` : t`Over`;
    const isPositiveRemaining = remaining >= 0;

    return (
        <View className="gap-4">
            <BudgetOverviewCard
                title={budget.title}
                isOnTrack={isOnTrack}
                statusLabel={statusLabel}
                spentLabel={t`Spent`}
                spentFormatted={spentFormatted}
                remainingLabel={remainingLabel}
                remainingFormatted={remainingFormatted}
                isPositiveRemaining={isPositiveRemaining}
                progressBar={<BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />}
            />

            <View className="gap-4">
                <BudgetStatsCards
                    daysRemaining={periodInfo.daysRemaining}
                    totalDays={periodInfo.totalDays}
                    dailyFormatted={dailyFormatted}
                    projectedFormatted={projectedFormatted}
                />

                <BudgetHealthCard
                    categoriesCount={categoryStats.length}
                    overBudgetCount={overBudgetCount}
                    underBudgetCount={underBudgetCount}
                />

                <TopCategoriesCard categories={topCategories} />

                <BudgetSummaryCard
                    plannedFormatted={plannedFormatted}
                    spentFormatted={spentFormatted}
                    projectedFormatted={projectedFormatted}
                    spentPercent={spentPercent}
                />

                <BudgetPlanNextPeriod budget={budget} currentPeriodEndDate={periodDates.endDate} />

                <BudgetHistoricalPeriods
                    periods={historicalPeriods}
                    categoryIds={categoryIds}
                    totalPlanned={totalPlanned}
                    currencySymbol={currencySymbol}
                    allocations={allocations}
                />
            </View>
        </View>
    );
};
