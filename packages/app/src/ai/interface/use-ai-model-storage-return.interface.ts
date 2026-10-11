import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiModelStorageDisablePreviewInterface } from './ai-model-storage-disable-preview.interface';
import type { AiModelStorageSnapshotInterface } from './ai-model-storage-snapshot.interface';

export interface UseAiModelStorageReturnInterface {
    readonly snapshot: AiModelStorageSnapshotInterface;
    readonly isLoading: boolean;
    readonly updatingFeatureId: AiFeatureIdEnum | null;
    readonly isFreeingUnused: boolean;
    readonly errorMessage: string | null;
    readonly refresh: () => void;
    readonly setFeatureEnabled: (
        featureId: AiFeatureIdEnum,
        isEnabled: boolean,
        removeUnusedDownloads: boolean
    ) => Promise<AiModelStorageSnapshotInterface>;
    readonly previewDisableFeature: (featureId: AiFeatureIdEnum) => Promise<AiModelStorageDisablePreviewInterface>;
    readonly freeUnusedDownloads: () => Promise<AiModelStorageSnapshotInterface>;
}
