export interface SyncWorkloadQueuedTaskInterface {
    readonly cancel: () => void;
    readonly name: string;
    readonly run: () => Promise<void>;
}
