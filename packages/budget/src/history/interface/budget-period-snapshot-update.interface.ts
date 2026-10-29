import type { BudgetPeriodSnapshotCreateEntityInterface } from '@budgie/contracts';

export type BudgetPeriodSnapshotUpdateInterface = Partial<
    Pick<BudgetPeriodSnapshotCreateEntityInterface, 'overallSpent' | 'otherSpent' | 'otherCarriedIn'>
>;
