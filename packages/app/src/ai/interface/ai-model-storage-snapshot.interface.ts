import { AiFeatureStorageInterface } from './ai-feature-storage.interface';
import { AiModelStorageEntryInterface } from './ai-model-storage-entry.interface';

export interface AiModelStorageSnapshotInterface {
    readonly entries: readonly AiModelStorageEntryInterface[];
    readonly features: readonly AiFeatureStorageInterface[];
    readonly unusedBytes: number;
    readonly totalBytes: number;
}
