import { budgetPeriodService, budgetSpentService } from '@budgie/budget';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetRepository } from '../../@generic/drizzle/db/db';

import type { BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetSpentResult {
    readonly spent: BudgetSpentInterface;
    readonly isLoading: boolean;
}

const EMPTY_SPENT: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [] };

const EPOCH = new Date(0);

export const useGetBudgetSpentQuery = (budget: BudgetEntityInterface | null): UseGetBudgetSpentResult => {
    const window = isDefined(budget)
        ? budgetPeriodService.computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date())
        : null;
    const periodStart = isDefined(window) ? window.periodStart : EPOCH;
    const nextPeriodStart = isDefined(window) ? window.nextPeriodStart : EPOCH;
    const baseInstrumentId = isDefined(budget) ? budget.instrumentId : 0;

    const entriesQuery = budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, baseInstrumentId);
    const { data: entriesData, updatedAt: entriesUpdatedAt } = useLiveQuery(entriesQuery, [
        periodStart.getTime(),
        nextPeriodStart.getTime(),
        baseInstrumentId
    ]);

    if (!isDefined(budget) || !isDefined(entriesUpdatedAt)) {
        return { spent: EMPTY_SPENT, isLoading: true };
    }

    if (!isPositiveNumber(baseInstrumentId)) {
        return { spent: EMPTY_SPENT, isLoading: false };
    }

    const spent = budgetSpentService.computeSpent(entriesData, baseInstrumentId);

    return { spent, isLoading: false };
};
