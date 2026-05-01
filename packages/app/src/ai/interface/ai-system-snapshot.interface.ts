import { AiSystemActionEnum } from '../enum/ai-system-action.enum';
import { AiSystemStateEnum } from '../enum/ai-system-state.enum';

export interface AiSystemSnapshotInterface {
    readonly state: AiSystemStateEnum;
    readonly percent: number;
    readonly statusText: string;
    readonly action: AiSystemActionEnum;
    readonly translationPending: number;
    readonly embeddingPending: number;
    readonly errorMessage: string | null;
}
