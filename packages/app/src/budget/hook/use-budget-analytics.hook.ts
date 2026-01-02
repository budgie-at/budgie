import { BudgetAllocationEntityInterface, BudgetEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useMemo } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { MS_PER_DAY } from '../constant/ms-per-day.constant';
import { useGetBudgetActualSpendingQuery } from '../query/use-get-budget-actual-spending.query';
import { useGetBudgetAllocationsQuery } from '../query/use-get-budget-allocations.query';
import { useGetBudgetIncomeQuery } from '../query/use-get-budget-income.query';
import { useGetSpendingByCategoryQuery } from '../query/use-get-spending-by-category.query';
import { calculateEffectivePlannedAmount, calculateTotalPlannedAmount } from '../util/calculate-effective-planned-amount.util';
import { formatMonthYear } from '../util/format-month-year.util';

const HISTORICAL_PERIODS_COUNT = 3;
const PACING_TOLERANCE = 10;
const UNDER_BUDGET_THRESHOLD = 50;

interface CategoryStatData {
    name: string;
    icon: UserIconNameEnum;
    spent: number;
    planned: number;
    remaining: number;
    percentage: number;
    isOverBudget: boolean;
}

interface HistoricalPeriod {
    label: string;
    startDate: Date;
    endDate: Date;
}

interface PeriodInfo {
    daysElapsed: number;
    totalDays: number;
    daysRemaining: number;
    progressPercent: number;
}

export const useBudgetAnalytics = (budget: BudgetEntityInterface) => {
    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';

    const categoryIds = useMemo(
        () => allocations.map((alloc: BudgetAllocationEntityInterface) => alloc.categoryId).filter((id): id is number => isDefined(id)),
        [allocations]
    );

    const periodDates = useMemo(() => {
        const now = new Date();
        const { startDay } = budget;
        const year = now.getFullYear();
        const month = now.getMonth();

        let startDate = new Date(year, month, startDay);
        if (startDate > now) {
            startDate = new Date(year, month - 1, startDay);
        }

        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);

        return { startDate, endDate };
    }, [budget]);

    const historicalPeriods: HistoricalPeriod[] = useMemo(() => {
        const { startDay } = budget;
        const periods: HistoricalPeriod[] = [];

        for (let idx = 1; idx <= HISTORICAL_PERIODS_COUNT; idx += 1) {
            const currentStart = periodDates.startDate;
            const startDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - idx, startDay);
            const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDay);
            const label = formatMonthYear(startDate);

            periods.push({ label, startDate, endDate });
        }

        return periods;
    }, [budget, periodDates.startDate]);

    const { totalSpent } = useGetBudgetActualSpendingQuery({
        categoryIds,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const { totalIncome } = useGetBudgetIncomeQuery({
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const { spendingByCategory } = useGetSpendingByCategoryQuery({
        categoryIds,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const startTime = periodDates.startDate.getTime();
    const endTime = periodDates.endDate.getTime();
    const nowTime = new Date().getTime();
    const daysElapsed = Math.floor((nowTime - startTime) / MS_PER_DAY);
    const totalDays = Math.floor((endTime - startTime) / MS_PER_DAY);
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercent = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

    const periodInfo: PeriodInfo = { daysElapsed, totalDays, daysRemaining, progressPercent };

    const totalPlanned = calculateTotalPlannedAmount(allocations, totalIncome);

    const categoryStats = useMemo<CategoryStatData[]>(
        () =>
            allocations.map((allocation: BudgetAllocationEntityInterface) => {
                const category = categories.find((cat: CategoryEntityInterface) => cat.id === allocation.categoryId);
                const spending = spendingByCategory.find(
                    (sp: { categoryId: number; total: number }) => sp.categoryId === allocation.categoryId
                );
                const spent = spending?.total ?? 0;
                const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
                const remaining = planned - spent;
                const percentage = isPositiveNumber(planned) ? Math.round((spent / planned) * 100) : 0;

                return {
                    name: category?.title ?? '-',
                    icon: category?.icon ?? UserIconNameEnum.Wallet,
                    spent,
                    planned,
                    remaining,
                    percentage,
                    isOverBudget: spent > planned
                };
            }),
        [allocations, spendingByCategory, categories, totalIncome]
    );

    const remaining = totalPlanned - totalSpent;
    const spentPercent = totalPlanned > 0 ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOnTrack = spentPercent <= periodInfo.progressPercent + PACING_TOLERANCE;

    const dailyAverage = periodInfo.daysElapsed > 0 ? totalSpent / periodInfo.daysElapsed : 0;
    const projectedSpend = dailyAverage * periodInfo.totalDays;

    const overBudgetCount = categoryStats.filter(cat => cat.isOverBudget).length;
    const underBudgetCount = categoryStats.filter(cat => cat.percentage < UNDER_BUDGET_THRESHOLD && cat.planned > 0).length;

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
