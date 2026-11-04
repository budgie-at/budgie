import { BudgetPeriodSnapshotRepository } from '@budgie/budget';
import { BudgetPeriodCategorySnapshotEntityTable, BudgetPeriodSnapshotEntityTable } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

interface UseGetBudgetPeriodSnapshotResult {
    readonly snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface | null;
    readonly isLoading: boolean;
    readonly isError: boolean;
}

const budgetPeriodSnapshotAtom = databaseQueryFamily(
    [BudgetPeriodSnapshotEntityTable, BudgetPeriodCategorySnapshotEntityTable],
    BudgetPeriodSnapshotRepository,
    (budgetPeriodSnapshotRepository, snapshotId: number) => budgetPeriodSnapshotRepository.findById(snapshotId)
);

export const useGetBudgetPeriodSnapshotQuery = (snapshotId: number): UseGetBudgetPeriodSnapshotResult => {
    const result = useLiveAtomValue(budgetPeriodSnapshotAtom(snapshotId));

    if (AsyncResult.isInitial(result)) {
        return { snapshot: null, isLoading: true, isError: false };
    }

    const snapshot = AsyncResult.getOrElse(result, () => null);

    return { snapshot: isDefined(snapshot) ? snapshot : null, isLoading: false, isError: AsyncResult.isFailure(result) };
};
