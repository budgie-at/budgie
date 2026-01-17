import { ReactNode } from 'react';
import { QWEN3_0_6B_QUANTIZED, WHISPER_BASE, useLLM, useSpeechToText } from 'react-native-executorch';

import { LlmContext } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

export const LlmProvider = ({ children }: Props) => {
    const llm = useLLM({ model: QWEN3_0_6B_QUANTIZED });
    const stt = useSpeechToText({ model: WHISPER_BASE });

    const value = { isAvailable: true, llm, stt };

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
