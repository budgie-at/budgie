import { ReactNode, useEffect, useState } from 'react';

import { commentEmbeddingRepository, merchantEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { AiEmbeddingProgressContext, AiEmbeddingProgressContextInterface } from '../context/ai-embedding-progress.context';

interface Props {
    readonly children: ReactNode;
}

export const AiEmbeddingProgressProvider = ({ children }: Props) => {
    const [progress, setProgress] = useState(0);
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [refreshVersion, setRefreshVersion] = useState(0);

    useEffect(() => {
        const loadProgress = async (): Promise<void> => {
            const merchantCount = await merchantEmbeddingRepository.countAll();
            const commentCount = await commentEmbeddingRepository.countAll();
            const total = merchantCount + commentCount;
            setProgress(total > 0 ? 100 : 0);
        };

        void loadProgress();
    }, [refreshVersion]);

    const refreshProgress = (): void => {
        setRefreshVersion(version => version + 1);
    };

    const value: AiEmbeddingProgressContextInterface = { progress, isEmbedding, refreshProgress, setIsEmbedding };

    return <AiEmbeddingProgressContext value={value}>{children}</AiEmbeddingProgressContext>;
};
