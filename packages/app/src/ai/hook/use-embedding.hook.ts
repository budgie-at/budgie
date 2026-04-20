import { useSyncExternalStore } from 'react';

import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { embeddingService } from '../service/embedding.service';

export const useEmbedding = (): LlamaSubsystemSnapshotInterface =>
    useSyncExternalStore(embeddingService.subscribe, embeddingService.getSnapshot);
