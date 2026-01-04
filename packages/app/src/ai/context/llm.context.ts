import { createContext, use } from 'react';
import { useLLM, useSpeechToText } from 'react-native-executorch';

interface LlmContextInterface {
    llm: ReturnType<typeof useLLM>;
    stt: ReturnType<typeof useSpeechToText>;
}

export const LlmContext = createContext<LlmContextInterface>({
    llm: {} as ReturnType<typeof useLLM>,
    stt: {} as ReturnType<typeof useSpeechToText>
});

export const useLlmContext = () => use(LlmContext);
