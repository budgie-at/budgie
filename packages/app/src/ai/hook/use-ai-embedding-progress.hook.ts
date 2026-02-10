import { useEffect, useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';

const FULL_PROGRESS = 100;

interface UseAiEmbeddingProgressReturn {
    readonly progress: number;
}

export const useAiEmbeddingProgress = (): UseAiEmbeddingProgressReturn => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const loadProgress = async (): Promise<void> => {
            const embeddedCount = await titleEmbeddingRepository.countAll();
            const totalContexts = await titleEmbeddingRepository.countDistinctTransactionContexts();

            const computed = isPositiveNumber(totalContexts) ? Math.round((embeddedCount / totalContexts) * FULL_PROGRESS) : 0;
            setProgress(computed);
        };

        void loadProgress();
    }, []);

    return { progress };
};
