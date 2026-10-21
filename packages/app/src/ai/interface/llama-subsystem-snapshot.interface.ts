import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

export interface LlamaSubsystemSnapshotInterface {
    readonly status: AiSubsystemStatusEnum;
    readonly errorMessage: string | null;
}
