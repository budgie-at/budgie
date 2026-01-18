/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import type { useLLM, useSpeechToText } from 'react-native-executorch';

export interface LlmContextInterface {
    isAvailable: boolean;
    llm: ReturnType<typeof useLLM>;
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
