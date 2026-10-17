import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

import type { AiModelDownloadProgressInterface } from './ai-model-download-progress.interface';

export interface AiModelDownloadSnapshotInterface {
    readonly status: AiModelDownloadStatusEnum;
    readonly models: Readonly<Record<AiSubsystemNameEnum, AiModelDownloadProgressInterface>>;
    readonly bytesPerSecond: number;
    readonly missingBytes: number;
    readonly freeBytes: number;
    readonly isMobileDataAllowed: boolean;
    readonly isNoticeDismissed: boolean;
}
