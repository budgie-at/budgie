import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useGetInstrumentByIdQuery } from '../../instrument/query/use-get-instrument-by-id.query';
import { MS_PER_DAY } from '../constant/ms-per-day.constant';
import { useGetBudgetActualSpendingQuery } from '../query/use-get-budget-actual-spending.query';
import { useGetBudgetAllocationsQuery } from '../query/use-get-budget-allocations.query';
import { useGetBudgetIncomeQuery } from '../query/use-get-budget-income.query';
import { useGetSpendingByCategoryQuery } from '../query/use-get-spending-by-category.query';
import { calculateHistoricalPeriods, calculatePeriodDates } from '../util/budget-analytics-calculations.util';
import { calculateEffectivePlannedAmount, calculateTotalPlannedAmount } from '../util/calculate-effective-planned-amount.util';

const PACING_TOLERANCE = 10;
const UNDER_BUDGET_THRESHOLD = 50;

export const useBudgetAnalytics = (budget: BudgetEntityInterface) => {
    const { allocations } = useGetBudgetAllocationsQuery(budget.id);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const { categories } = useAllCategoriesQuery();

    const currencySymbol = instrument?.symbol ?? '';

    const categoryIds = allocations.map(alloc => alloc.categoryId).filter((id): id is number => isDefined(id));

    const periodDates = calculatePeriodDates(budget);
    const historicalPeriods = calculateHistoricalPeriods(budget, periodDates);

    const { totalSpent } = useGetBudgetActualSpendingQuery({ categoryIds, startDate: periodDates.startDate, endDate: periodDates.endDate });
    const { totalIncome } = useGetBudgetIncomeQuery({ startDate: periodDates.startDate, endDate: periodDates.endDate });
    const { spendingByCategory } = useGetSpendingByCategoryQuery({
        categoryIds,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate
    });

    const nowTime = new Date().getTime();
    const daysElapsed = Math.floor((nowTime - periodDates.startDate.getTime()) / MS_PER_DAY);
    const totalDays = Math.floor((periodDates.endDate.getTime() - periodDates.startDate.getTime()) / MS_PER_DAY);
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercent = isPositiveNumber(totalDays) ? Math.round((daysElapsed / totalDays) * 100) : 0;
    const periodInfo = { daysElapsed, totalDays, daysRemaining, progressPercent };

    const totalPlanned = calculateTotalPlannedAmount(allocations, totalIncome);

    const categoryStats = allocations.map(allocation => {
        const category = categories.find(cat => cat.id === allocation.categoryId);
        const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
        const spent = spending?.total ?? 0;
        const planned = calculateEffectivePlannedAmount(allocation, totalIncome);
        const percentage = isPositiveNumber(planned) ? Math.round((spent / planned) * 100) : 0;

        return {
            spent,
            planned,
            percentage,
            remaining: planned - spent,
            name: category?.title ?? '-',
            isOverBudget: spent > planned,
            icon: category?.icon ?? UserIconNameEnum.Wallet
        };
    });

    const remaining = totalPlanned - totalSpent;
    const spentPercent = isPositiveNumber(totalPlanned) ? Math.round((totalSpent / totalPlanned) * 100) : 0;
    const isOnTrack = spentPercent <= periodInfo.progressPercent + PACING_TOLERANCE;
    const dailyAverage = isPositiveNumber(periodInfo.daysElapsed) ? totalSpent / periodInfo.daysElapsed : 0;
    const projectedSpend = dailyAverage * periodInfo.totalDays;

    const overBudgetCount = categoryStats.filter(category => category.isOverBudget).length;
    const underBudgetCount = categoryStats.filter(
        category => category.percentage < UNDER_BUDGET_THRESHOLD && isPositiveNumber(category.planned)
    ).length;

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
