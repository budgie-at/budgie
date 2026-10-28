import type { BudgetPeriodCategorySnapshotEntityInterface, BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';

export interface BudgetCarrySourceInterface extends Pick<
    BudgetPeriodSnapshotEntityInterface,
    'otherLimit' | 'otherSpent' | 'otherCarriedIn' | 'otherRolloverMode'
> {
    readonly categories: readonly Pick<
        BudgetPeriodCategorySnapshotEntityInterface,
        'categoryId' | 'limitAmount' | 'spent' | 'carriedIn' | 'rolloverMode'
    >[];
}
