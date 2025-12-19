import { useLLM, useSpeechToText } from 'react-native-executorch';

import { AI_SPEECH_MODEL } from '../constant/ai-speech-model.constant';
import { AI_TEXT_MODEL } from '../constant/ai-text-model.constant';

export const useLlm = () => {
    const llm = useLLM({ model: AI_TEXT_MODEL });
    const speechToText = useSpeechToText({ model: AI_SPEECH_MODEL });

    return [llm, speechToText] as const;
};
