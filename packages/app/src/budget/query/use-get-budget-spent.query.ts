import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { budgetRepository, settingsRepository } from '../../@generic/drizzle/db/db';
import { computeBudgetSpent } from '../utils/compute-budget-spent.util';
import { computePeriodWindow } from '../utils/compute-period-window.util';

import type { BudgetSpentInterface } from '../interface/budget-spent.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetSpentResult {
    readonly spent: BudgetSpentInterface;
    readonly isLoading: boolean;
}

const EMPTY_SPENT: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [], fallbackCount: 0 };

export const useGetBudgetSpentQuery = (budget: BudgetEntityInterface | null): UseGetBudgetSpentResult => {
    const window = isDefined(budget) ? computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, new Date()) : null;
    const periodStartMs = isDefined(window) ? window.periodStart.getTime() : 0;
    const nextPeriodStartMs = isDefined(window) ? window.nextPeriodStart.getTime() : 0;

    const periodStart = new Date(periodStartMs);
    const nextPeriodStart = new Date(nextPeriodStartMs);

    const { data: settingsData, updatedAt: settingsUpdatedAt } = useLiveQuery(settingsRepository.findSettings(), []);

    const baseInstrumentId = settingsData?.defaultInstrumentId ?? 0;

    const entriesQuery = budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, baseInstrumentId);
    const { data: entriesData, updatedAt: entriesUpdatedAt } = useLiveQuery(entriesQuery, [
        periodStartMs,
        nextPeriodStartMs,
        baseInstrumentId
    ]);

    if (!isDefined(budget) || !isDefined(settingsUpdatedAt) || !isDefined(entriesUpdatedAt)) {
        return { spent: EMPTY_SPENT, isLoading: true };
    }

    if (!isPositiveNumber(baseInstrumentId)) {
        return { spent: EMPTY_SPENT, isLoading: false };
    }

    const spent = computeBudgetSpent(entriesData, baseInstrumentId);

    return { spent, isLoading: false };
};
