import { BudgetPeriodSnapshotRepository } from '@budgie/budget';
import { BudgetPeriodCategorySnapshotEntityTable, BudgetPeriodSnapshotEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

interface UseGetBudgetPeriodSnapshotsResult {
    readonly snapshots: readonly BudgetPeriodSnapshotWithCategoriesEntityInterface[];
    readonly isLoading: boolean;
}

const HISTORY_CLOSED_PERIOD_COUNT = 5;
const EMPTY_SNAPSHOTS: readonly BudgetPeriodSnapshotWithCategoriesEntityInterface[] = [];

const budgetPeriodSnapshotsAtom = databaseQueryFamily(
    [BudgetPeriodSnapshotEntityTable, BudgetPeriodCategorySnapshotEntityTable],
    BudgetPeriodSnapshotRepository,
    (budgetPeriodSnapshotRepository, budgetId: number) => budgetPeriodSnapshotRepository.findRecent(budgetId, HISTORY_CLOSED_PERIOD_COUNT)
);

export const useGetBudgetPeriodSnapshotsQuery = (budgetId: number): UseGetBudgetPeriodSnapshotsResult => {
    const result = useLiveAtomValue(budgetPeriodSnapshotsAtom(budgetId));

    if (AsyncResult.isInitial(result)) {
        return { snapshots: EMPTY_SNAPSHOTS, isLoading: true };
    }

    return { snapshots: AsyncResult.getOrElse(result, () => EMPTY_SNAPSHOTS), isLoading: false };
};
