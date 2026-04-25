import { getLogger } from '@budgie/contracts';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { categoryRepository, tagRepository } from '../../@generic/drizzle/db/db';

const logger = getLogger('translationProgressStore');

interface TranslationProgressSnapshotInterface {
    readonly percent: number;
    readonly total: number;
    readonly pending: number;
    readonly isTranslating: boolean;
}

const FULL_PERCENT = 100;

let snapshot: TranslationProgressSnapshotInterface = { percent: 0, total: 0, pending: 0, isTranslating: false };
const listeners = new Set<() => void>();

const notify = (): void => {
    listeners.forEach(listener => {
        listener();
    });
};

export const translationProgressStore = {
    subscribe(listener: () => void): () => void {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    },
    getSnapshot(): TranslationProgressSnapshotInterface {
        return snapshot;
    },
    async refresh(): Promise<void> {
        try {
            const [categoryPending, tagPending, categoryAll, tagAll] = await Promise.all([
                categoryRepository.countUntranslated(),
                tagRepository.countUntranslated(),
                categoryRepository.countAll(),
                tagRepository.countAll()
            ]);
            const total = categoryAll + tagAll;
            const pending = categoryPending + tagPending;
            const percent = total === 0 ? FULL_PERCENT : Math.round(((total - pending) / total) * FULL_PERCENT);
            const next: TranslationProgressSnapshotInterface = {
                percent,
                total,
                pending,
                isTranslating: pending > 0
            };
            if (
                next.percent !== snapshot.percent ||
                next.total !== snapshot.total ||
                next.pending !== snapshot.pending ||
                next.isTranslating !== snapshot.isTranslating
            ) {
                snapshot = next;
                logger.log('translation:progress:refresh', { total, pending, percent, isTranslating: next.isTranslating });
                notify();
            }
        } catch (error: unknown) {
            logger.error('translation:progress:refresh:throw', { errorMessage: getErrorMessage(error) });
            emptyFn();
        }
    }
};
