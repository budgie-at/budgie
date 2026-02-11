import { ReactNode, useEffect, useState } from 'react';

import { titleEmbeddingRepository } from '../../@generic/drizzle/db/db';
import { AiEmbeddingProgressContext, AiEmbeddingProgressContextInterface } from '../context/ai-embedding-progress.context';

interface Props {
    readonly children: ReactNode;
}

export const AiEmbeddingProgressProvider = ({ children }: Props) => {
    const [progress, setProgress] = useState(0);
    const [refreshVersion, setRefreshVersion] = useState(0);

    useEffect(() => {
        const loadProgress = async (): Promise<void> => {
            const result = await titleEmbeddingRepository.getEmbeddingCoverageProgress();
            setProgress(result);
        };

        void loadProgress();
    }, [refreshVersion]);

    const refreshProgress = (): void => {
        setRefreshVersion(version => version + 1);
    };

    const value: AiEmbeddingProgressContextInterface = { progress, refreshProgress };

    return <AiEmbeddingProgressContext value={value}>{children}</AiEmbeddingProgressContext>;
};
