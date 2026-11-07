import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';
import type { SyncRecordTargetInterface } from '../../upload/interface/sync-record-target.interface';

export interface CloudSyncPushedItemInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly records: readonly SyncRecordInterface[];
    readonly deleteTargets: readonly SyncRecordTargetInterface[];
    readonly savedSystemFields: Map<string, string>;
    readonly deletedKeys: Set<string>;
}
