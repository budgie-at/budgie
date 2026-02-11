export interface GenerateOptionsInterface {
    maxNewTokens?: number;
    temperature?: number;
}

export interface LlmInterface {
    isReady: boolean;
    isEmbeddingReady: boolean;
    isInitializing: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    error: string | null;
    generate: (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface) => Promise<string>;
    embedding: (text: string) => Promise<number[]>;
    batchEmbedding: (texts: string[]) => Promise<Map<string, number[]>>;
    interrupt: () => void;
}
