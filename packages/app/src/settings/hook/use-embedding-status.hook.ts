import { useEffect, useState } from 'react';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../../ai/context/llm.context';

interface EmbeddingStatusInterface {
    readonly embeddedCount: number;
    readonly totalUniqueContexts: number;
    readonly isLlmReady: boolean;
}

export const useEmbeddingStatus = (): EmbeddingStatusInterface => {
    const { llm } = useLlmContext();
    const [embeddedCount, setEmbeddedCount] = useState(0);
    const [totalUniqueContexts, setTotalUniqueContexts] = useState(0);

    useEffect(() => {
        const fetchStatus = async (): Promise<void> => {
            const [embedded, total] = await Promise.all([
                titleEmbeddingRepository.countAll(),
                titleEmbeddingRepository.countDistinctTransactionContexts()
            ]);

            setEmbeddedCount(embedded);
            setTotalUniqueContexts(total);
        };

        void fetchStatus();
    }, []);

    return { embeddedCount, totalUniqueContexts, isLlmReady: llm.isReady };
};
