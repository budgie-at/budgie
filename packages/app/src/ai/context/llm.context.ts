/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import type { LlmInterface } from '@budgie/ai';
import type { useSpeechToText } from 'react-native-executorch';

export interface LlmContextInterface {
    readonly isAvailable: boolean;
    readonly llm: LlmInterface;
    readonly stt: ReturnType<typeof useSpeechToText>;
}

export const LlmContext = createContext<LlmContextInterface | null>(null);

export const useLlmContext = (): LlmContextInterface => {
    const context = use(LlmContext);

    if (context === null) {
        throw new Error('useLlmContext must be used within LlmProvider');
    }

    return context;
};
