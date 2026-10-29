import { computeBudgetProjection } from '@budgie/budget';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { BUDGET_PROJECTION_TABLES } from '../constant/budget-projection-tables.constant';
import { BudgetProjectionService } from '../service/budget-projection.service';
import { fromBudgetProjectionKey } from '../utils/from-budget-projection-key.util';
import { resolveBudgetWindow } from '../utils/resolve-budget-window.util';
import { toBudgetProjectionKey } from '../utils/to-budget-projection-key.util';

import { useGetBudgetCategoryLimitsQuery } from './use-get-budget-category-limits.query';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetProjectionInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetProjectionResult {
    readonly projection: BudgetProjectionInterface;
    readonly isLoading: boolean;
}

export const budgetProjectionAtom = databaseQueryFamily(
    BUDGET_PROJECTION_TABLES,
    BudgetProjectionService,
    (budgetProjectionService, key: BudgetProjectionKeyInterface) =>
        budgetProjectionService.project(fromBudgetProjectionKey(key), new Date(key.dayStart))
);

export const useGetBudgetProjectionQuery = (budget: BudgetEntityInterface): UseGetBudgetProjectionResult => {
    const today = useToday();
    const { categoryLimits } = useGetBudgetCategoryLimitsQuery(budget.id);
    const result = useLiveAtomValue(budgetProjectionAtom(toBudgetProjectionKey(budget, new Date(today).setHours(0, 0, 0, 0))));

    if (AsyncResult.isSuccess(result)) {
        return { projection: result.value, isLoading: false };
    }

    return {
        projection: computeBudgetProjection({
            ...resolveBudgetWindow(budget, today),
            now: today,
            overallLimit: budget.overallLimit,
            otherLimit: budget.otherLimit,
            categoryLimits,
            entries: [],
            upcomingCharges: [],
            reservations: []
        }),
        isLoading: true
    };
};
