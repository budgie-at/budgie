import type { SyncIncomingDeletionInterface } from './sync-incoming-deletion.interface';
import type { SyncIncomingRecordInterface } from './sync-incoming-record.interface';

export interface SyncApplyBatchInterface {
    readonly records: readonly SyncIncomingRecordInterface[];
    readonly deletions: readonly SyncIncomingDeletionInterface[];
}
