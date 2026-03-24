import { ReactNode } from 'react';
import { WHISPER_SMALL, useSpeechToText } from 'react-native-executorch';

import { LlmContext } from '../context/llm.context';
import { useLlamaLlm } from '../hook/use-llama-llm.hook';

interface Props {
    readonly children: ReactNode;
}

export const LlmProvider = ({ children }: Props) => {
    console.log('[LLM-PROVIDER] Mounting LlmProvider'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
    const llm = useLlamaLlm();
    const stt = useSpeechToText({ model: WHISPER_SMALL });

    // eslint-disable-next-line no-console, lingui/no-unlocalized-strings
    console.log('[LLM-PROVIDER] LLM state:', {
        isReady: llm.isReady,
        isEmbeddingReady: llm.isEmbeddingReady,
        isInitializing: llm.isInitializing,
        error: llm.error,
        downloadProgress: llm.downloadProgress
    });
    const value = { isAvailable: true, llm, stt };

    return <LlmContext value={value}>{children}</LlmContext>;
};
