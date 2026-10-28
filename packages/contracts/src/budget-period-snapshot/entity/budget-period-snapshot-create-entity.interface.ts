import type { BudgetPeriodSnapshotEntityInterface } from './budget-period-snapshot-entity.interface';

export type BudgetPeriodSnapshotCreateEntityInterface = Pick<
    BudgetPeriodSnapshotEntityInterface,
    'budgetId' | 'periodStart' | 'periodEnd' | 'overallLimit' | 'overallSpent' | 'otherLimit' | 'otherSpent' | 'isReconstructed'
>;
