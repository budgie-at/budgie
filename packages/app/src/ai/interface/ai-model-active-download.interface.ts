import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

import type { DownloadTask } from 'expo-file-system';

export interface AiModelActiveDownloadInterface {
    readonly name: AiSubsystemNameEnum;
    readonly task: DownloadTask;
}
