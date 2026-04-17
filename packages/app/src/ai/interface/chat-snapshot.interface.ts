import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

export interface ChatSnapshotInterface {
    readonly status: AiSubsystemStatusEnum;
    readonly downloadProgress: number;
    readonly errorMessage: string | null;
}
