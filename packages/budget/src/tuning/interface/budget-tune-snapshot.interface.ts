import type { BudgetPeriodCategorySnapshotEntityInterface, BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';

export interface BudgetTuneSnapshotInterface extends Pick<
    BudgetPeriodSnapshotEntityInterface,
    'periodStart' | 'isReconstructed' | 'otherLimit' | 'otherSpent' | 'otherCarriedIn'
> {
    readonly categories: readonly Pick<BudgetPeriodCategorySnapshotEntityInterface, 'categoryId' | 'limitAmount' | 'carriedIn' | 'spent'>[];
}
