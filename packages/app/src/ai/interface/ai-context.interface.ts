import type { LlmInterface } from '@budgie/ai';

import { AiModeEnum } from '../enum/ai-mode.enum';

export interface AiContextInterface {
    readonly mode: AiModeEnum;
    readonly llm: LlmInterface;
    readonly progress: number;
    readonly isEmbedding: boolean;
    readonly downloadProgress: number;
    readonly retry: () => void;
    readonly refreshProgress: () => void;
}
