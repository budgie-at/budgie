import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

export interface EmbeddingSnapshotInterface {
    readonly status: AiSubsystemStatusEnum;
    readonly downloadProgress: number;
    readonly errorMessage: string | null;
}
