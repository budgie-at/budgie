export interface SyncReenqueuedRecordInterface {
    readonly recordType: string;
    readonly syncZone: string;
    readonly syncId: string;
    readonly changedColumns: readonly string[];
}
