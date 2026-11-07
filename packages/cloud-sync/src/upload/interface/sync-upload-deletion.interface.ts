import type { SyncRecordTargetInterface } from './sync-record-target.interface';

export interface SyncUploadDeletionInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly targets: readonly SyncRecordTargetInterface[];
}
