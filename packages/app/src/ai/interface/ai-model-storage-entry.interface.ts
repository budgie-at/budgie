import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';

export interface AiModelStorageEntryInterface {
    readonly id: AiModelStorageIdEnum;
    readonly bytes: number;
    readonly isCurrent: boolean;
    readonly isBusy: boolean;
}
