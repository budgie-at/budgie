import { BudgetEntityInterface, BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { BudgetCalculationResultInterface } from '../interface/budget-calculation-result.interface';
import { BudgetPeriodComparisonInterface } from '../interface/budget-period-comparison.interface';
import { BudgetTrendDataPointInterface } from '../interface/budget-trend-data-point.interface';
import { budgetHistoryService } from '../service/budget-history.service';

import { useGetActiveBudgetQuery } from './use-get-active-budget.query';
import { useGetBudgetCalculationQuery } from './use-get-budget-calculation.query';
import { useGetBudgetSnapshotByPeriodQuery } from './use-get-budget-snapshot-by-period.query';

const buildCurrentPeriod = (calculation: BudgetCalculationResultInterface, label: string): BudgetTrendDataPointInterface => ({
    periodLabel: label,
    periodStart: calculation.budget.startDate,
    spent: calculation.totalSpent,
    limit: calculation.overallLimit,
    percentage: calculation.overallPercentage,
    status: calculation.overallStatus
});

const buildComparison = (
    calculation: BudgetCalculationResultInterface,
    snapshot: BudgetPeriodSnapshotEntityInterface
): BudgetPeriodComparisonInterface =>
    budgetHistoryService.comparePeriods(
        {
            spent: calculation.totalSpent,
            limit: calculation.overallLimit,
            percentage: calculation.overallPercentage,
            income: calculation.totalActualIncome
        },
        snapshot
    );

interface BudgetPeriodDetailResult {
    readonly budget: BudgetEntityInterface | null;
    readonly snapshot: BudgetPeriodSnapshotEntityInterface | null;
    readonly previousPeriod: BudgetTrendDataPointInterface | null;
    readonly currentPeriod: BudgetTrendDataPointInterface | null;
    readonly comparison: BudgetPeriodComparisonInterface | null;
    readonly isLoading: boolean;
}

export const useGetBudgetPeriodDetailQuery = (periodStartDate: Date | null, currentLabel: string): BudgetPeriodDetailResult => {
    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const { snapshot, isLoading: isSnapshotLoading } = useGetBudgetSnapshotByPeriodQuery(budget?.id, periodStartDate);
    const { calculation } = useGetBudgetCalculationQuery(budget);

    const isLoading = isBudgetLoading || isSnapshotLoading;
    const resolvedBudget = budget ?? null;

    if (!isDefined(snapshot)) {
        return { budget: resolvedBudget, snapshot: null, previousPeriod: null, currentPeriod: null, comparison: null, isLoading };
    }

    const previousPeriod = budgetHistoryService.convertSnapshotToTrendPoint(snapshot);
    const currentPeriod = isDefined(calculation) ? buildCurrentPeriod(calculation, currentLabel) : null;
    const comparison = isDefined(calculation) ? buildComparison(calculation, snapshot) : null;

    return { budget: resolvedBudget, snapshot, previousPeriod, currentPeriod, comparison, isLoading };
};
