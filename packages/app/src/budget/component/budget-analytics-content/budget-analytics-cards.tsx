import { BudgetAllocationEntityInterface, BudgetEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { BudgetHealthCard } from '../budget-health-card/budget-health-card';
import { BudgetHistoricalPeriods } from '../budget-historical-periods/budget-historical-periods';
import { BudgetPlanNextPeriod } from '../budget-plan-next-period/budget-plan-next-period';
import { BudgetStatsCards } from '../budget-stats-cards/budget-stats-cards';
import { BudgetSummaryCard } from '../budget-summary-card/budget-summary-card';
import { TopCategoriesCard, TopCategoryData } from '../top-categories-card/top-categories-card';

interface PeriodInfo {
    daysRemaining: number;
    totalDays: number;
}

interface HistoricalPeriod {
    label: string;
    startDate: Date;
    endDate: Date;
}

interface PeriodDates {
    startDate: Date;
    endDate: Date;
}

interface Props {
    readonly periodInfo: PeriodInfo;
    readonly dailyFormatted: string;
    readonly projectedFormatted: string;
    readonly categoriesCount: number;
    readonly overBudgetCount: number;
    readonly underBudgetCount: number;
    readonly topCategories: TopCategoryData[];
    readonly plannedFormatted: string;
    readonly spentFormatted: string;
    readonly spentPercent: number;
    readonly budget: BudgetEntityInterface;
    readonly periodDates: PeriodDates;
    readonly historicalPeriods: readonly HistoricalPeriod[];
    readonly categoryIds: readonly number[];
    readonly totalPlanned: number;
    readonly currencySymbol: string;
    readonly allocations: readonly BudgetAllocationEntityInterface[];
}

export const BudgetAnalyticsCards = ({
    periodInfo,
    dailyFormatted,
    projectedFormatted,
    categoriesCount,
    overBudgetCount,
    underBudgetCount,
    topCategories,
    plannedFormatted,
    spentFormatted,
    spentPercent,
    budget,
    periodDates,
    historicalPeriods,
    categoryIds,
    totalPlanned,
    currencySymbol,
    allocations
}: Props) => (
    <View className="gap-4">
        <BudgetStatsCards
            daysRemaining={periodInfo.daysRemaining}
            totalDays={periodInfo.totalDays}
            dailyFormatted={dailyFormatted}
            projectedFormatted={projectedFormatted}
        />

        <BudgetHealthCard
            categoriesCount={categoriesCount}
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
);

