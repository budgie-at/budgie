import type { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

export interface CloudSyncSessionInterface {
    readonly isEngineRunning: boolean;
    readonly isAwaitingMeta: boolean;
    readonly isFetching: boolean;
    readonly blocked: CloudSyncStatusEnum | null;
    readonly lastSyncedAt: number | null;
    readonly fetchedRecordCount: number;
    readonly isInitialFetchComplete: boolean;
}
