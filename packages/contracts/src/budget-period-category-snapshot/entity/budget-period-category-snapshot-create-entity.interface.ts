import type { BudgetPeriodCategorySnapshotEntityInterface } from './budget-period-category-snapshot-entity.interface';

export type BudgetPeriodCategorySnapshotCreateEntityInterface = Pick<
    BudgetPeriodCategorySnapshotEntityInterface,
    'snapshotId' | 'categoryId' | 'limitAmount' | 'spent' | 'carriedIn' | 'rolloverMode'
> &
    Partial<Pick<BudgetPeriodCategorySnapshotEntityInterface, 'fundCovered'>>;
