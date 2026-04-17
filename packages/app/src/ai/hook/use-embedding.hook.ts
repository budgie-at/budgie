import { useSyncExternalStore } from 'react';

import { EmbeddingSnapshotInterface } from '../interface/embedding-snapshot.interface';
import { embeddingService } from '../service/embedding.service';

export const useEmbedding = (): EmbeddingSnapshotInterface =>
    useSyncExternalStore(embeddingService.subscribe, embeddingService.getSnapshot);
