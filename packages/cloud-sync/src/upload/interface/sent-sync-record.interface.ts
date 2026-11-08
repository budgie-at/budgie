import type { SyncRecordInterface } from '../../mapping/interface/sync-record.interface';

export interface SentSyncRecordInterface {
    readonly record: SyncRecordInterface;
    readonly systemFields: string | null;
}
