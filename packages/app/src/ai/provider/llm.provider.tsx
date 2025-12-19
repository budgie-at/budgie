import { ReactNode } from 'react';
import { LLAMA3_2_1B_QLORA, WHISPER_TINY, useLLM, useSpeechToText } from 'react-native-executorch';

import { LlmContext } from '../context/llm.context';

interface Props {
    readonly children: ReactNode;
}

export const LlmProvider = ({ children }: Props) => {
    const llm = useLLM({ model: LLAMA3_2_1B_QLORA });
    const speechToText = useSpeechToText({ model: WHISPER_TINY });

    const value = { llm, speechToText };

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
