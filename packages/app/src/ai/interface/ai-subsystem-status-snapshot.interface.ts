import { AiSubsystemCardStateEnum } from '../enum/ai-subsystem-card-state.enum';

export interface AiSubsystemStatusSnapshotInterface {
    readonly state: AiSubsystemCardStateEnum;
    readonly statusText: string;
    readonly percent: number;
    readonly pending: number;
    readonly total: number;
    readonly errorMessage: string | null;
}
