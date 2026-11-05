import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';

export interface SyncUploadSaveInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly records: readonly SyncRecordInterface[];
    readonly changedFields: readonly string[];
}
