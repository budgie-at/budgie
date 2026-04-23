import { useSyncExternalStore } from 'react';

import { EmbeddingProgressSnapshotInterface, embeddingProgressStore } from '../store/embedding-progress.store';

const subscribe = (listener: () => void): (() => void) => embeddingProgressStore.subscribe(listener);
const getSnapshot = (): EmbeddingProgressSnapshotInterface => embeddingProgressStore.getSnapshot();

export const useEmbeddingProgressSnapshot = (): EmbeddingProgressSnapshotInterface => useSyncExternalStore(subscribe, getSnapshot);
