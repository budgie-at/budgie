export interface ProgressCallbackInterface {
    readonly onStep: () => void;
    readonly onEmbeddingStored: (contextCount: number) => void;
    readonly onBatchDiscovered: (batchSize: number) => void;
}
