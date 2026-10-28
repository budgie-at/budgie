import type { BudgetPeriodCategorySnapshotCreateEntityInterface, BudgetPeriodSnapshotCreateEntityInterface } from '@budgie/contracts';

export interface BudgetPeriodSnapshotRowsInterface extends Pick<
    BudgetPeriodSnapshotCreateEntityInterface,
    'otherSpent' | 'otherCarriedIn'
> {
    readonly categories: readonly Omit<BudgetPeriodCategorySnapshotCreateEntityInterface, 'snapshotId'>[];
}
