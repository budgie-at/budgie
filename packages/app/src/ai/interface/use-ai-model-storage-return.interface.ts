import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiFeatureStorageInterface } from './ai-feature-storage.interface';
import type { AiModelStorageSnapshotInterface } from './ai-model-storage-snapshot.interface';

export interface UseAiModelStorageReturnInterface {
    readonly snapshot: AiModelStorageSnapshotInterface;
    readonly isLoading: boolean;
    readonly updatingFeatureId: AiFeatureIdEnum | null;
    readonly isFreeingUnused: boolean;
    readonly isMutating: boolean;
    readonly errorMessage: string | null;
    readonly handleFeatureChange: (feature: AiFeatureStorageInterface, title: string) => void;
    readonly handleFreeUnusedDownloads: () => void;
}
