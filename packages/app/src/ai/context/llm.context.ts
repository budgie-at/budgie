/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import type { LlmInterface } from '@budgie/ai';

export interface SttContextInterface {
    readonly isReady: boolean;
    readonly isInitializing: boolean;
    readonly downloadProgress: number;
    readonly error: string | null;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
    readonly stream: (options?: { readonly language?: string }) => Promise<string>;
    readonly streamStop: () => Promise<void> | void;
    readonly streamInsert: (samples: Float32Array) => void;
}

export interface LlmContextInterface {
    readonly isAvailable: boolean;
    readonly llm: LlmInterface;
    readonly stt: SttContextInterface;
}

export const LlmContext = createContext<LlmContextInterface | null>(null);

export const useLlmContext = (): LlmContextInterface => {
    const context = use(LlmContext);

    if (context === null) {
        throw new Error('useLlmContext must be used within LlmProvider');
    }

    return context;
};
