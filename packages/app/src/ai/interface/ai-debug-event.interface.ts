import { AiModeEnum } from '../enum/ai-mode.enum';

export interface AiDebugEventInterface {
    readonly timestamp: number;
    readonly fromMode: AiModeEnum;
    readonly toMode: AiModeEnum;
    readonly trigger: string;
    readonly errorMessage: string | null;
}
