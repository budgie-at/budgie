import { ReactNode } from 'react';
import { WHISPER_BASE, useSpeechToText } from 'react-native-executorch';

import { LlmContext } from '../context/llm.context';
import { useLlamaLlm } from '../hook/use-llama-llm.hook';

interface Props {
    readonly children: ReactNode;
}

export const LlmProvider = ({ children }: Props) => {
    const llm = useLlamaLlm();
    const stt = useSpeechToText({ model: WHISPER_BASE });
    const value = { isAvailable: true, llm, stt };

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
