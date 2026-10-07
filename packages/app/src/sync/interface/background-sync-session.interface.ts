export interface BackgroundSyncSessionInterface {
    readonly isContinued: boolean;
    readonly completedCount: number;
    readonly positions: ReadonlyMap<number, number | null>;
}
