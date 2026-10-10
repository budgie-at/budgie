import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

export interface AiModelStorageFileInterface {
    readonly id: AiModelStorageIdEnum;
    readonly path: readonly string[];
    readonly isCurrent: boolean;
    readonly subsystem: AiSubsystemNameEnum | null;
}
