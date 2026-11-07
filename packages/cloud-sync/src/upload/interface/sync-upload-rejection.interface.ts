export interface SyncUploadRejectionInterface {
    readonly syncZone: string;
    readonly syncId: string;
    readonly syncRevision: number;
    readonly reason: string;
}
