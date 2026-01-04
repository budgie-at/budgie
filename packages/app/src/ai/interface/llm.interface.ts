interface LlmMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LlmInterface {
    isReady: boolean;
    isGenerating: boolean;
    response: string;
    downloadProgress: number;
    generate: (messages: LlmMessage[]) => Promise<void>;
}
