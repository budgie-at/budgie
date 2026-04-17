import { AiModeEnum } from '../enum/ai-mode.enum';

export interface ProgressCallbackInterface {
    readonly getMode?: () => AiModeEnum;
    readonly onStep: () => void;
    readonly onEmbeddingStored: (contextCount: number) => void;
}
