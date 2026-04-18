import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { transactionEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { aiLog } from '../utils/ai-log.util';

interface EmbeddingProgressSnapshotInterface {
    readonly percent: number;
    readonly isEmbedding: boolean;
}

let snapshot: EmbeddingProgressSnapshotInterface = { percent: 0, isEmbedding: false };
const listeners = new Set<() => void>();

const notify = (): void => {
    listeners.forEach(listener => {
        listener();
    });
};

export const embeddingProgressStore = {
    subscribe(listener: () => void): () => void {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): EmbeddingProgressSnapshotInterface {
        return snapshot;
    },
    async refresh(): Promise<void> {
        try {
            const total = await transactionRepository.countAllActive();
            const pending = await transactionEmbeddingRepository.countPending();
            const percent = total === 0 ? 100 : Math.round(((total - pending) / total) * 100);
            const prior = snapshot;
            snapshot = { percent, isEmbedding: pending > 0 };
            if (prior.percent !== percent || prior.isEmbedding !== snapshot.isEmbedding) {
                aiLog('embed:progress:refresh', { total, pending, percent, isEmbedding: snapshot.isEmbedding });
            }
            notify();
        } catch (error: unknown) {
            aiLog('embed:progress:refresh:throw', { errorMessage: getErrorMessage(error) });
            emptyFn();
        }
    }
};
