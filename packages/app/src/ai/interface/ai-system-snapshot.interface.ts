import { AiSystemStateEnum } from '../enum/ai-system-state.enum';

export interface AiSystemSnapshotInterface {
    readonly state: AiSystemStateEnum;
    readonly percent: number;
}
