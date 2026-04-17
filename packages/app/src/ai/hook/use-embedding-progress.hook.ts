import { useSyncExternalStore } from 'react';

import { embeddingProgressStore } from '../store/embedding-progress.store';

interface EmbeddingProgressInterface {
    readonly progress: number;
    readonly isEmbedding: boolean;
}

export const useEmbeddingProgress = (): EmbeddingProgressInterface => {
    const snapshot = useSyncExternalStore(
        listener => embeddingProgressStore.subscribe(listener),
        () => embeddingProgressStore.getSnapshot()
    );

    return { progress: snapshot.percent, isEmbedding: snapshot.isEmbedding };
};
