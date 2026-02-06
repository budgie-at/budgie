/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import type { useSpeechToText } from 'react-native-executorch';

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
    embedding: (text: string) => Promise<number[]>;
    interrupt: () => void;
}

export interface LlmContextInterface {
    isAvailable: boolean;
    llm: LlmInterface;
    stt: ReturnType<typeof useSpeechToText>;
}

export const LlmContext = createContext<LlmContextInterface | null>(null);

export const useLlmContext = (): LlmContextInterface => {
    const context = use(LlmContext);

    if (context === null) {
        throw new Error('useLlmContext must be used within LlmProvider');
    }

    return context;
};
