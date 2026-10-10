import { AiModelStorageIdEnum } from '../enum/ai-model-storage-id.enum';

import type { AiModelStorageSnapshotInterface } from './ai-model-storage-snapshot.interface';

export interface UseAiModelStorageReturnInterface {
    readonly snapshot: AiModelStorageSnapshotInterface;
    readonly isLoading: boolean;
    readonly removingId: AiModelStorageIdEnum | null;
    readonly isRemovingAll: boolean;
    readonly errorMessage: string | null;
    readonly refresh: () => void;
    readonly remove: (id: AiModelStorageIdEnum) => Promise<AiModelStorageSnapshotInterface>;
    readonly removeAll: () => Promise<AiModelStorageSnapshotInterface>;
}
