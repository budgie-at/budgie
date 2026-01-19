import { BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';
import { format } from 'date-fns';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { budgetPeriodSnapshotRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { BudgetStatusEnum } from '../enum/budget-status.enum';
import { BudgetPeriodComparisonInterface } from '../interface/budget-period-comparison.interface';
import { BudgetTrendDataPointInterface } from '../interface/budget-trend-data-point.interface';
import { CategoryLimitSnapshotInterface } from '../interface/category-limit-snapshot.interface';
import { IncomeExpectationSnapshotInterface } from '../interface/income-expectation-snapshot.interface';

const DEFAULT_PERIOD_COUNT = 6;

class BudgetHistoryService {
    async getSnapshots(budgetId: number, limit?: number): Promise<BudgetPeriodSnapshotEntityInterface[]> {
        return isDefined(limit)
            ? budgetPeriodSnapshotRepository.findByBudgetIdLimited(budgetId, limit)
            : budgetPeriodSnapshotRepository.findByBudgetId(budgetId);
    }

    async getTrendData(budgetId: number, periodCount = DEFAULT_PERIOD_COUNT): Promise<BudgetTrendDataPointInterface[]> {
        const snapshots = await budgetPeriodSnapshotRepository.findByBudgetIdLimited(budgetId, periodCount);

        return snapshots.reverse().map(snapshot => this.convertSnapshotToTrendPoint(snapshot));
    }

    comparePeriods(
        current: { spent: number; limit: number; percentage: number; income: number },
        previous: BudgetPeriodSnapshotEntityInterface
    ): BudgetPeriodComparisonInterface {
        const previousSpent = convertFromMicroUnits(previous.totalSpent);
        const previousLimit = convertFromMicroUnits(previous.overallLimit);
        const previousPercentage = previousLimit > 0 ? (previousSpent / previousLimit) * 100 : 0;
        const previousIncome = convertFromMicroUnits(previous.totalActualIncome);

        const spentDelta = current.spent - previousSpent;
        const spentDeltaPercentage = previousSpent > 0 ? ((current.spent - previousSpent) / previousSpent) * 100 : 0;
        const limitDelta = current.limit - previousLimit;
        const percentageDelta = current.percentage - previousPercentage;
        const incomeDelta = current.income - previousIncome;

        return {
            spentDelta,
            spentDeltaPercentage,
            limitDelta,
            percentageDelta,
            incomeDelta
        };
    }

    parseCategoryLimitsJson(json: string | null): CategoryLimitSnapshotInterface[] {
        if (!isNotEmptyString(json)) {
            return [];
        }

        const parsed: unknown = JSON.parse(json);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((item: { categoryId: number; limit: number; spent: number }) => ({
            categoryId: item.categoryId,
            limit: convertFromMicroUnits(item.limit),
            spent: convertFromMicroUnits(item.spent)
        }));
    }

    parseIncomeExpectationsJson(json: string | null): IncomeExpectationSnapshotInterface[] {
        if (!isNotEmptyString(json)) {
            return [];
        }

        const parsed: unknown = JSON.parse(json);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((item: { categoryId: number; expected: number; actual: number }) => ({
            categoryId: item.categoryId,
            expected: convertFromMicroUnits(item.expected),
            actual: convertFromMicroUnits(item.actual)
        }));
    }

    convertSnapshotToTrendPoint(snapshot: BudgetPeriodSnapshotEntityInterface): BudgetTrendDataPointInterface {
        const spent = convertFromMicroUnits(snapshot.totalSpent);
        const limit = convertFromMicroUnits(snapshot.overallLimit);
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
            periodLabel: format(snapshot.periodStart, 'MMM'),
            periodStart: snapshot.periodStart,
            spent,
            limit,
            percentage,
            status: this.getStatus(percentage)
        };
    }

    getStatus(percentage: number): BudgetStatusEnum {
        if (percentage >= 100) {
            return BudgetStatusEnum.OVER;
        }

        if (percentage >= 80) {
            return BudgetStatusEnum.WARNING;
        }

        return BudgetStatusEnum.ON_TRACK;
    }
}

export const budgetHistoryService = new BudgetHistoryService();
