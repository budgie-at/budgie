import { AiModelStorageIdEnum } from '../../enum/ai-model-storage-id.enum';

export const AiModelStorageCardSelector = {
    Container: 'AiModelStorageCard',
    RemoveAllButton: 'AiModelStorageCard.RemoveAllButton',
    Row: (id: AiModelStorageIdEnum) => `AiModelStorageCard.Row.${id}`,
    RemoveButton: (id: AiModelStorageIdEnum) => `AiModelStorageCard.RemoveButton.${id}`
};
