import { createContext, use } from 'react';
import { SpeechToTextModule } from 'react-native-executorch';

import { LlmType } from '../type/llm.type';

interface LlmContextInterface {
    llm: LlmType;
    speechToTextModule: SpeechToTextModule;
    sttDownloadProgress: number;
    isSttReady: boolean;
}

export const LlmContext = createContext<LlmContextInterface>({
    llm: {} as LlmContextInterface['llm'],
    speechToTextModule: {} as LlmContextInterface['speechToTextModule'],
    sttDownloadProgress: 0,
    isSttReady: false
});

export const useLlmContext = () => use(LlmContext);
