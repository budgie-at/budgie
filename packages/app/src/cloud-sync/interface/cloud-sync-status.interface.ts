import type { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

export interface CloudSyncStatusInterface {
    readonly status: CloudSyncStatusEnum;
    readonly lastSyncedAt: number | null;
    readonly fetchedRecordCount: number;
    readonly isInitialFetchComplete: boolean;
}
