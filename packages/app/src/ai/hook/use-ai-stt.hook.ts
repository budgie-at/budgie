import { WHISPER_SMALL, useSpeechToText } from 'react-native-executorch';

import { AiSttInterface } from '../interface/ai-stt.interface';

export const useAiStt = (): AiSttInterface => useSpeechToText({ model: WHISPER_SMALL });
