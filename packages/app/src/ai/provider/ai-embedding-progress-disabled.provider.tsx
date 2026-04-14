import { ReactNode } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { AiEmbeddingProgressContext, AiEmbeddingProgressContextInterface } from '../context/ai-embedding-progress.context';

interface Props {
    readonly children: ReactNode;
}

const disabledValue: AiEmbeddingProgressContextInterface = {
    progress: 0,
    isEmbedding: false,
    refreshProgress: emptyFn,
    setIsEmbedding: emptyFn
};

export const AiEmbeddingProgressDisabledProvider = ({ children }: Props) => (
    <AiEmbeddingProgressContext value={disabledValue}>{children}</AiEmbeddingProgressContext>
);
