import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiFeatureContentInterface } from './ai-feature-content.interface';
import type { UseAiModelStorageReturnInterface } from './use-ai-model-storage-return.interface';

export interface UseAiModelStorageActionsParamsInterface {
    readonly featureContent: Record<AiFeatureIdEnum, AiFeatureContentInterface>;
    readonly isAiAvailable: boolean;
    readonly isMutating: boolean;
    readonly setFeatureEnabled: UseAiModelStorageReturnInterface['setFeatureEnabled'];
    readonly previewDisableFeature: UseAiModelStorageReturnInterface['previewDisableFeature'];
    readonly freeUnusedDownloads: UseAiModelStorageReturnInterface['freeUnusedDownloads'];
}
