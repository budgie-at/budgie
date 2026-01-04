import { createContext, use } from 'react';

import { SttInterface } from '../interface/stt.interface';
import { LlmType } from '../type/llm.type';

interface LlmContextInterface {
    llm: LlmType;
    stt: SttInterface;
}

const NOOP_LLM: LlmType = {
    isReady: false,
    isGenerating: false,
    response: '',
    downloadProgress: 0,
    // eslint-disable-next-line lingui/no-unlocalized-strings
    generate: async () => Promise.reject(new Error('LlmProvider not initialized'))
};

export const LlmContext = createContext<LlmContextInterface>({
    llm: NOOP_LLM,
    stt: {} as SttInterface
});

export const useLlmContext = () => use(LlmContext);
