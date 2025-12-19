import { LLAMA3_2_1B_QLORA, WHISPER_TINY, useLLM, useSpeechToText } from 'react-native-executorch';

export const useLlm = () => {
    const llm = useLLM({ model: LLAMA3_2_1B_QLORA });
    const speechToText = useSpeechToText({ model: WHISPER_TINY });

    return [llm, speechToText] as const;
};
