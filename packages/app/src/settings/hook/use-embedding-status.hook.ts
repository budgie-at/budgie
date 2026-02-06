import { useEffect, useState } from 'react';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { useLlmContext } from '../../ai/context/llm.context';

interface EmbeddingStatusInterface {
    readonly embeddedCount: number;
    readonly totalUniqueTitles: number;
    readonly isLlmReady: boolean;
}

export const useEmbeddingStatus = (): EmbeddingStatusInterface => {
    const { llm } = useLlmContext();
    const [embeddedCount, setEmbeddedCount] = useState(0);
    const [totalUniqueTitles, setTotalUniqueTitles] = useState(0);

    useEffect(() => {
        const fetchStatus = async (): Promise<void> => {
            const [embedded, total] = await Promise.all([
                titleEmbeddingRepository.countAll(),
                titleEmbeddingRepository.countDistinctTransactionTitles()
            ]);

            setEmbeddedCount(embedded);
            setTotalUniqueTitles(total);
        };

        void fetchStatus();
    }, []);

    return { embeddedCount, totalUniqueTitles, isLlmReady: llm.isReady };
};
