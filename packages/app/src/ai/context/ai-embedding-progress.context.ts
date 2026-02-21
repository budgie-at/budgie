/* eslint-disable lingui/no-unlocalized-strings */
import { createContext, use } from 'react';

import { isDefined } from '@rnw-community/shared';

export interface AiEmbeddingProgressContextInterface {
    readonly progress: number;
    readonly isEmbedding: boolean;
    readonly refreshProgress: () => void;
    readonly setIsEmbedding: (value: boolean) => void;
}

export const AiEmbeddingProgressContext = createContext<AiEmbeddingProgressContextInterface | null>(null);

export const useAiEmbeddingProgressContext = (): AiEmbeddingProgressContextInterface => {
    const context = use(AiEmbeddingProgressContext);

    if (!isDefined(context)) {
        throw new Error('useAiEmbeddingProgressContext must be used within AiEmbeddingProgressProvider');
    }

    return context;
};
