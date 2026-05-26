export interface MoneyDataUpgradeRuntimeSnapshotInterface {
    readonly isRunning: boolean;
    readonly pendingEntryCount: number;
    readonly processedEntryCount: number;
    readonly totalEntryCount: number;
    readonly lastError: string | null;
}
