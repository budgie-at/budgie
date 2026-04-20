import { useSyncExternalStore } from 'react';

import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';
import { aiEmbeddingStatusService } from '../service/ai-embedding-status.service';

export const useAiEmbeddingStatus = (): AiSubsystemStatusSnapshotInterface =>
    useSyncExternalStore(aiEmbeddingStatusService.subscribe, aiEmbeddingStatusService.getSnapshot);
