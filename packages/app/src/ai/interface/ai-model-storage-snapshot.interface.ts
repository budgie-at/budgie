import { AiModelStorageEntryInterface } from './ai-model-storage-entry.interface';

export interface AiModelStorageSnapshotInterface {
    readonly entries: readonly AiModelStorageEntryInterface[];
    readonly totalBytes: number;
}
