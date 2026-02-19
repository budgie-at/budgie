/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import type { LlmInterface } from '@budgie/ai';
import type { DecodingOptions } from 'react-native-executorch';

export interface SttContextInterface {
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
    readonly stream: (options?: DecodingOptions) => Promise<string>;
    readonly streamStop: () => void;
    readonly streamInsert: (waveform: number[] | Float32Array) => void;
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
