import { getLogger } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined } from '@rnw-community/shared';

import { transactionEmbeddingRepository, transactionRepository } from '../../@generic/drizzle/db/db';

const logger = getLogger('embeddingProgressStore');

export interface EmbeddingProgressSnapshotInterface {
    readonly percent: number;
    readonly isEmbedding: boolean;
    readonly pending: number;
    readonly total: number;
}

const FULL_PERCENT = 100;
const REFRESH_THROTTLE_MS = 1000;

let snapshot: EmbeddingProgressSnapshotInterface = { percent: 0, isEmbedding: false, pending: 0, total: 0 };
let lastRefreshAt = 0;
let pendingRefresh: Promise<void> | null = null;
const listeners = new Set<() => void>();

const notify = (): void => {
    listeners.forEach(listener => {
        listener();
    });
};

const runRefresh = async (): Promise<void> => {
    try {
        const total = await transactionRepository.countAllActive();
        const pending = await transactionEmbeddingRepository.countPending();
        const percent = total === 0 ? FULL_PERCENT : Math.round(((total - pending) / total) * FULL_PERCENT);
        const prior = snapshot;
        snapshot = { percent, isEmbedding: pending > 0, pending, total };
        if (prior.percent !== percent || prior.isEmbedding !== snapshot.isEmbedding || prior.pending !== pending) {
            logger.log('embed:progress:refresh', { total, pending, percent, isEmbedding: snapshot.isEmbedding });
        }
        notify();
    } catch (error: unknown) {
        logger.error('embed:progress:refresh:throw', { errorMessage: getErrorMessage(error) });
        emptyFn();
    }
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
    async refresh(force = false): Promise<void> {
        if (isDefined(pendingRefresh)) {
            await pendingRefresh;

            return;
        }
        const elapsed = Date.now() - lastRefreshAt;
        if (!force && elapsed < REFRESH_THROTTLE_MS) {
            return;
        }
        lastRefreshAt = Date.now();
        pendingRefresh = runRefresh().finally(() => {
            pendingRefresh = null;
        });
        await pendingRefresh;
    }
};
