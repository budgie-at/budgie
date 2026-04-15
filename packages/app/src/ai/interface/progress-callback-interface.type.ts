export interface ProgressCallbackInterface {
    readonly onStep: () => void;
    readonly onEmbeddingStored: (contextCount: number) => void;
}
