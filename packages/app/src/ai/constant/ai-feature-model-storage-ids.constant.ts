import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';
import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';

export const AI_FEATURE_MODEL_STORAGE_IDS: Record<AiFeatureIdEnum, readonly AiModelStorageIdEnum[]> = {
    [AiFeatureIdEnum.VOICE_INPUT]: [AiModelStorageIdEnum.CHAT, AiModelStorageIdEnum.EMBEDDING, AiModelStorageIdEnum.STT],
    [AiFeatureIdEnum.TRANSACTION_SUGGESTIONS]: [AiModelStorageIdEnum.EMBEDDING],
    [AiFeatureIdEnum.CATEGORY_TAG_TRANSLATIONS]: [AiModelStorageIdEnum.CHAT]
};
