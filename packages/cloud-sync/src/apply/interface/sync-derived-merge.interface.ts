export interface SyncDerivedMergeInterface {
    readonly recordType: string;
    readonly keptSyncId: string;
    readonly droppedSyncIds: readonly string[];
}
