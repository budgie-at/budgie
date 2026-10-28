import type { BudgetPeriodCategorySnapshotCreateEntityInterface } from '@budgie/contracts';

export type BudgetPeriodCategorySnapshotUpdateInterface = Partial<
    Pick<BudgetPeriodCategorySnapshotCreateEntityInterface, 'spent' | 'carriedIn'>
>;
