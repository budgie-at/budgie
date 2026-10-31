import type { BudgetHistoryBarInterface } from '../interface/budget-history-bar.interface';
import type { BudgetPeriodSnapshotWithCategoriesEntityInterface } from '@budgie/contracts';

export const buildBudgetHistoryBars = (
    snapshotsNewestFirst: readonly BudgetPeriodSnapshotWithCategoriesEntityInterface[],
    currentBar: BudgetHistoryBarInterface,
    formatLabel: (periodStart: Date, periodEnd: Date) => string
): readonly BudgetHistoryBarInterface[] => [
    ...snapshotsNewestFirst
        .map(snapshot => ({
            key: String(snapshot.id),
            label: formatLabel(snapshot.periodStart, snapshot.periodEnd),
            spent: snapshot.overallSpent,
            limit: snapshot.overallLimit,
            isCurrent: false,
            isEstimated: snapshot.isReconstructed,
            snapshotId: snapshot.id
        }))
        .reverse(),
    currentBar
];
