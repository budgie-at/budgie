import type { SentSyncRecordInterface } from './sent-sync-record.interface';
import type { SyncRecordTargetInterface } from './sync-record-target.interface';

export interface SyncUploadAcknowledgementInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly sentRecords: readonly SentSyncRecordInterface[];
    readonly deletedTargets: readonly SyncRecordTargetInterface[];
}
