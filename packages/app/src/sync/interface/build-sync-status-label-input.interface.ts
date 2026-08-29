import type { SyncStatusEnum } from '@budgie/contracts';

export interface BuildSyncStatusLabelInputInterface {
    readonly status: SyncStatusEnum;
    readonly isForwardMode: boolean;
    readonly isSyncing: boolean;
}
