/* eslint-disable id-length, react-hooks/purity */
import { BudgetAllocationEntityInterface, BudgetEntityInterface } from '@budgie/contracts';
import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useGetBudgetActualSpendingQuery } from '../query/use-get-budget-actual-spending.query';
import { useGetBudgetIncomeQuery } from '../query/use-get-budget-income.query';
import { useGetSpendingByCategoryQuery } from '../query/use-get-spending-by-category.query';
import { calculateTotalPlannedAmount } from '../util/calculate-effective-planned-amount.util';

import { useBudgetPeriodDates } from './use-budget-period-dates.hook';

const MS_PER_DAY = 86400000;

interface SpendingByCategory {
    categoryId: number;
    total: number;
}

interface BudgetStatsResult {
    periodDates: { startDate: Date; endDate: Date };
    totalSpent: number;
    totalIncome: number;
    totalPlanned: number;
    remaining: number;
    spendingByCategory: SpendingByCategory[];
    periodInfo: {
        daysElapsed: number;
        totalDays: number;
        daysRemaining: number;
    };
    categoryIds: number[];
}

export const useBudgetStats = (
    budget: BudgetEntityInterface | null | undefined,
    allocations: BudgetAllocationEntityInterface[]
): BudgetStatsResult => {
    const categoryIds = useMemo(
        () => allocations.map(a => a.categoryId).filter((id): id is number => isDefined(id)),
        [allocations]
    );

    const periodDates = useBudgetPeriodDates(budget);

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

    const totalPlanned = calculateTotalPlannedAmount(allocations, totalIncome);

    const remaining = totalPlanned - totalSpent;

    const periodInfo = useMemo(() => {
        const now = Date.now();
        const startTime = periodDates.startDate.getTime();
        const endTime = periodDates.endDate.getTime();
        const daysElapsed = Math.max(0, Math.floor((now - startTime) / MS_PER_DAY));
        const totalDays = Math.max(1, Math.floor((endTime - startTime) / MS_PER_DAY));
        const daysRemaining = Math.max(0, totalDays - daysElapsed);

        return { daysElapsed, totalDays, daysRemaining };
    }, [periodDates]);

    return {
        periodDates,
        totalSpent,
        totalIncome,
        totalPlanned,
        remaining,
        spendingByCategory,
        periodInfo,
        categoryIds
    };
};


