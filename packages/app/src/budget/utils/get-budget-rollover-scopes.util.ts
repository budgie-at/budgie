import { computeSnapshotCarryOuts } from '@budgie/budget';

import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

export const getBudgetRolloverScopes = (
    snapshot: BudgetPeriodSnapshotWithCategoriesEntityInterface
): readonly (readonly [categoryId: number | null, amount: number])[] => {
    const carryOuts = computeSnapshotCarryOuts(snapshot);
    const scopes: (readonly [number | null, number])[] = [...carryOuts.byCategory, [null, carryOuts.other]];

    return scopes.filter(([, amount]) => amount !== 0);
};
