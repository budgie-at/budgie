import { SerializedEmbeddingResultInterface } from './serialized-embedding-result.interface';

export interface PrepareSuggestionResultInterface {
    readonly resolved: SerializedEmbeddingResultInterface;
    readonly methodStart: number;
}
