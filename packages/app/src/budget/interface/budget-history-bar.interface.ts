export interface BudgetHistoryBarInterface {
    readonly key: string;
    readonly label: string;
    readonly spent: number;
    readonly limit: number;
    readonly isCurrent: boolean;
    readonly isEstimated: boolean;
    readonly snapshotId: number | null;
}
