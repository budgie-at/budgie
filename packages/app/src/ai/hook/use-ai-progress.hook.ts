import { useSyncExternalStore } from 'react';

import { useAiProgressContext } from '../context/ai-progress.context';
import { embeddingProgressStore } from '../store/embedding-progress.store';

export const useAiProgress = () => {
    const storeSnapshot = useSyncExternalStore(
        listener => embeddingProgressStore.subscribe(listener),
        () => embeddingProgressStore.getSnapshot()
    );
    const context = useAiProgressContext();

    return {
        progress: storeSnapshot.percent,
        isEmbedding: storeSnapshot.isEmbedding,
        downloadProgress: context.downloadProgress
    };
};
