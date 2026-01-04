import { createContext, use } from 'react';

import { SttInterface } from '../interface/stt.interface';
import { LlmType } from '../type/llm.type';

interface LlmContextInterface {
    llm: LlmType;
    stt: SttInterface;
}

export const LlmContext = createContext<LlmContextInterface>({
    llm: {} as LlmType,
    stt: {} as SttInterface
});

export const useLlmContext = () => use(LlmContext);
