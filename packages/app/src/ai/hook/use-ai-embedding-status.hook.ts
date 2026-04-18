import { useSyncExternalStore } from 'react';

import { AiEmbeddingStatusSnapshotInterface } from '../interface/ai-embedding-status-snapshot.interface';
import { aiEmbeddingStatusService } from '../service/ai-embedding-status.service';

export const useAiEmbeddingStatus = (): AiEmbeddingStatusSnapshotInterface =>
    useSyncExternalStore(aiEmbeddingStatusService.subscribe, aiEmbeddingStatusService.getSnapshot);
