import { createContext, use } from 'react';

import { LlmType } from '../type/llm.type';

import type { useSpeechToText } from 'react-native-executorch';

interface LlmContextInterface {
    llm: LlmType;
    speechToText: ReturnType<typeof useSpeechToText>;
}

export const LlmContext = createContext<LlmContextInterface>({
    llm: {} as LlmContextInterface['llm'],
    speechToText: {} as LlmContextInterface['speechToText']
});

export const useLlmContext = () => use(LlmContext);
