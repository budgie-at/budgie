import type { SyncStatusEnum } from '@budgie/contracts';

export interface BuildBankSyncStatusLabelInputInterface {
    readonly status: SyncStatusEnum;
    readonly isForwardMode: boolean;
    readonly isSyncing: boolean;
}
