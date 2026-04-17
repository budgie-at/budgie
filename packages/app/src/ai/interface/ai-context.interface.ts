import { AiModeEnum } from '../enum/ai-mode.enum';

import { AiSttInterface } from './ai-stt.interface';

import type { LlmInterface } from '@budgie/ai';

export interface AiContextInterface {
    readonly mode: AiModeEnum;
    readonly llm: LlmInterface;
    readonly stt: AiSttInterface;
    readonly retry: () => void;
}
