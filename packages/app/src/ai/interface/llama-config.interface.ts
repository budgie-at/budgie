export interface LlamaConfigInterface {
    readonly modelUrl: string;
    readonly modelFilename: string;
    readonly contextSize: number;
    readonly embedding: boolean;
    readonly poolingType?: 'mean' | 'none' | 'cls' | 'last';
}
