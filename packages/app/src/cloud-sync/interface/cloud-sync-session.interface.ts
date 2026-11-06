import type { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

export interface CloudSyncSessionInterface {
    readonly isEngineRunning: boolean;
    readonly isSharedEngineRunning: boolean;
    readonly isAwaitingMeta: boolean;
    readonly isReconciling: boolean;
    readonly isSharedReconciling: boolean;
    readonly isQuotaExceeded: boolean;
    readonly isFetching: boolean;
    readonly blocked: CloudSyncStatusEnum | null;
    readonly lastSyncedAt: number | null;
    readonly fetchedRecordCount: number;
    readonly isInitialFetchComplete: boolean;
}
