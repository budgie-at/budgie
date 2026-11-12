import type { CloudSyncErrorReasonEnum } from '../enum/cloud-sync-error-reason.enum';
import type { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

export interface CloudSyncStatusInterface {
    readonly status: CloudSyncStatusEnum;
    readonly lastSyncedAt: number | null;
    readonly fetchedRecordCount: number;
    readonly isInitialFetchComplete: boolean;
    readonly isQuotaExceeded: boolean;
    readonly errorReason: CloudSyncErrorReasonEnum | null;
}
