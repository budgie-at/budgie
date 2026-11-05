import type { SyncRecordInterface, SyncRecordTargetInterface } from '@budgie/contracts';

export interface CloudSyncPushedItemInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly records: readonly SyncRecordInterface[];
    readonly deleteTargets: readonly SyncRecordTargetInterface[];
    readonly savedSystemFields: Map<string, string>;
    readonly deletedKeys: Set<string>;
}
