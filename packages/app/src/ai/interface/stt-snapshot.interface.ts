import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';

export interface SttSnapshotInterface {
    readonly status: AiSubsystemStatusEnum;
    readonly downloadProgress: number;
    readonly errorMessage: string | null;
    readonly committedTranscription: string;
    readonly nonCommittedTranscription: string;
}
