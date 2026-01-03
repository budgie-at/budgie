import { BudgetEntityInterface } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { useGetBudgetActualSpendingQuery } from '../query/use-get-budget-actual-spending.query';
import { useGetBudgetAllocationsQuery } from '../query/use-get-budget-allocations.query';
import { useGetBudgetIncomeQuery } from '../query/use-get-budget-income.query';
import { type CategorySpendingInterface, useGetSpendingByCategoryQuery } from '../query/use-get-spending-by-category.query';
import {
    type HistoricalPeriodInterface,
    type PeriodDatesInterface,
    type PeriodInfoInterface,
    calculateHistoricalPeriods,
    calculatePeriodDates,
    calculatePeriodInfo
} from '../util/budget-analytics-calculations.util';
import {
    type CategoryStatInterface,
    calculateBudgetCounts,
    calculateCategoryStats,
    calculateTotalPlannedAmount
} from '../util/calculate-budget-stats.util';

const PACING_TOLERANCE = 10;

interface BudgetAnalyticsInterface {
    readonly currencySymbol: string;
    readonly categoryIds: number[];
    readonly periodDates: PeriodDatesInterface;
    readonly historicalPeriods: HistoricalPeriodInterface[];
    readonly periodInfo: PeriodInfoInterface;
    readonly totalSpent: number;
    readonly totalIncome: number;
    readonly totalPlanned: number;
    readonly remaining: number;
    readonly spentPercent: number;
    readonly isOnTrack: boolean;
    readonly dailyAverage: number;
    readonly projectedSpend: number;
    readonly categoryStats: CategoryStatInterface[];
    readonly overBudgetCount: number;
    readonly underBudgetCount: number;
    readonly spendingByCategory: CategorySpendingInterface[];
    readonly allocations: ReturnType<typeof useGetBudgetAllocationsQuery>['allocations'];
}

export const useBudgetAnalytics = (budget: BudgetEntityInterface): BudgetAnalyticsInterface => {
    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';
    const categoryIds = allocations.map(alloc => alloc.categoryId).filter((id): id is number => isDefined(id));

    const periodDates = calculatePeriodDates(budget);
    const historicalPeriods = calculateHistoricalPeriods(budget, periodDates);
    const periodInfo = calculatePeriodInfo(periodDates, new Date());

    const { totalSpent } = useGetBudgetActualSpendingQuery({ categoryIds, startDate: periodDates.startDate, endDate: periodDates.endDate });
    const { totalIncome } = useGetBudgetIncomeQuery({ startDate: periodDates.startDate, endDate: periodDates.endDate });
    const { spendingByCategory } = useGetSpendingByCategoryQuery({ categoryIds, startDate: periodDates.startDate, endDate: periodDates.endDate });

    const totalPlanned = calculateTotalPlannedAmount(allocations, totalIncome);
    const categoryStats = calculateCategoryStats(allocations, categories, spendingByCategory, totalIncome);
    const { overBudgetCount, underBudgetCount } = calculateBudgetCounts(categoryStats);

    const remaining = totalPlanned - totalSpent;
    const spentPercent = isPositiveNumber(totalPlanned) ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOnTrack = spentPercent <= periodInfo.progressPercent + PACING_TOLERANCE;
    const dailyAverage = isPositiveNumber(periodInfo.daysElapsed) ? totalSpent / periodInfo.daysElapsed : 0;
    const projectedSpend = dailyAverage * periodInfo.totalDays;

    return {
        allocations,
        currencySymbol,
        categoryIds,
        periodDates,
        historicalPeriods,
        totalSpent,
        totalIncome,
        spendingByCategory,
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
    };
};
