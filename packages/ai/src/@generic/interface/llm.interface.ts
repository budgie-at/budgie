export interface GenerateOptionsInterface {
    readonly maxNewTokens?: number;
    readonly temperature?: number;
}

export interface LlmInterface {
    readonly isReady: boolean;
    readonly isEmbeddingReady: boolean;
    readonly isInitializing: boolean;
    readonly isGenerating: boolean;
    readonly downloadProgress: number;
    readonly error: string | null;
    readonly generate: (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface) => Promise<string>;
    readonly embedding: (text: string) => Promise<number[]>;
    readonly batchEmbedding: (texts: string[]) => Promise<Map<string, number[]>>;
    readonly interrupt: () => void;
}
