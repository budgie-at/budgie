/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

export interface GenerateOptionsInterface {
    maxNewTokens?: number;
    temperature?: number;
}

export interface LlmInterface {
    isReady: boolean;
    isInitializing: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    error: string | null;
    generate: (systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface) => Promise<string>;
    interrupt: () => void;
}

export interface SttInterface {
    isReady: boolean;
    downloadProgress: number;
    error: string | null;
    isInitializing: boolean;
    committedTranscription: string;
    nonCommittedTranscription: string;
    stream: (options: { language: string }) => Promise<string>;
    streamInsert: (samples: Float32Array) => void;
    streamStop: () => void;
}

export interface LlmContextInterface {
    isAvailable: boolean;
    llm: LlmInterface;
    stt: SttInterface;
}

export const LlmContext = createContext<LlmContextInterface | null>(null);

export const useLlmContext = (): LlmContextInterface => {
    const context = use(LlmContext);

    if (context === null) {
        throw new Error('useLlmContext must be used within LlmProvider');
    }

    return context;
};
