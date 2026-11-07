import type { DecodedSyncRecordInterface } from './decoded-sync-record.interface';

export interface JoinedSyncRecordsInterface {
    readonly joined: readonly DecodedSyncRecordInterface[];
    readonly unmatched: readonly DecodedSyncRecordInterface[];
}
