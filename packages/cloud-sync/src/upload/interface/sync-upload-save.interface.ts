import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';
import type { SyncRecordTargetInterface } from './sync-record-target.interface';

export interface SyncUploadSaveInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly records: readonly SyncRecordInterface[];
    readonly changedFields: readonly string[];
    readonly staleTargets: readonly SyncRecordTargetInterface[];
}
