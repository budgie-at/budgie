import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

export interface SnapshotWithStatusInterface {
    readonly status: AiSubsystemStatusEnum;
    readonly errorMessage: string | null;
}
