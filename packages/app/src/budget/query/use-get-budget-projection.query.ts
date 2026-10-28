import { computeBudgetProjection, computePeriodWindow } from '@budgie/budget';
import {
    BudgetCategoryLimitEntityTable,
    BudgetPeriodCategorySnapshotEntityTable,
    BudgetPeriodSnapshotEntityTable,
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityTable,
    RecurringSeriesEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { TRANSACTION_LIST_TABLES } from '../../transaction/constant/transaction-list-tables.constant';
import { BudgetProjectionService } from '../service/budget-projection.service';

import { useGetBudgetCategoryLimitsQuery } from './use-get-budget-category-limits.query';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetProjectionResult {
    readonly projection: BudgetProjectionInterface;
    readonly isLoading: boolean;
}

export const budgetProjectionAtom = databaseQueryFamily(
    [
        ...TRANSACTION_LIST_TABLES,
        ExchangeRateEntityTable,
        HistoricalExchangeRateEntityTable,
        SettingsEntityTable,
        RecurringSeriesEntityTable,
        BudgetCategoryLimitEntityTable,
        BudgetPeriodSnapshotEntityTable,
        BudgetPeriodCategorySnapshotEntityTable
    ],
    BudgetProjectionService,
    (budgetProjectionService, key: BudgetProjectionKeyInterface) => budgetProjectionService.project(key, new Date(key.dayStart))
);

export const useGetBudgetProjectionQuery = (budget: BudgetEntityInterface): UseGetBudgetProjectionResult => {
    const today = useToday();
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budget.id);
    const result = useLiveAtomValue(
        budgetProjectionAtom({
            id: budget.id,
            periodStartDay: budget.periodStartDay,
            useLastDayOfMonth: budget.useLastDayOfMonth,
            instrumentId: budget.instrumentId,
            overallLimit: budget.overallLimit,
            otherLimit: budget.otherLimit,
            dayStart: new Date(today).setHours(0, 0, 0, 0)
        })
    );

    if (AsyncResult.isSuccess(result)) {
        return { projection: result.value, isLoading: false };
    }

    return {
        projection: computeBudgetProjection({
            ...computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, today),
            now: today,
            overallLimit: budget.overallLimit,
            otherLimit: budget.otherLimit,
            categoryLimits,
            entries: [],
            upcomingCharges: []
        }),
        isLoading: true
    };
};
