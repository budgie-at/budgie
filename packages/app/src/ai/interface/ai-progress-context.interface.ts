export interface AiProgressContextInterface {
    readonly progress: number;
    readonly isEmbedding: boolean;
    readonly downloadProgress: number;
    readonly refreshProgress: () => void;
}
