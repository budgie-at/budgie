import type { BudgetPeriodCategorySnapshotCreateEntityInterface, BudgetPeriodSnapshotCreateEntityInterface } from '@budgie/contracts';

export interface BudgetPeriodSnapshotRowsInterface extends Pick<
    BudgetPeriodSnapshotCreateEntityInterface,
    'overallSpent' | 'otherSpent' | 'otherCarriedIn'
> {
    readonly otherFundCovered: number;
    readonly categories: readonly Omit<BudgetPeriodCategorySnapshotCreateEntityInterface, 'snapshotId'>[];
}
