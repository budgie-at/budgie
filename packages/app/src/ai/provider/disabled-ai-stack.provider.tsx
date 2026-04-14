import { ReactNode } from 'react';

import { AiEmbeddingProgressDisabledProvider } from './ai-embedding-progress-disabled.provider';
import { AiStatusDisabledProvider } from './ai-status-disabled.provider';
import { LlmDisabledProvider } from './llm-disabled.provider';

interface Props {
    readonly children: ReactNode;
}

export const DisabledAiStackProvider = ({ children }: Props) => (
    <LlmDisabledProvider>
        <AiEmbeddingProgressDisabledProvider>
            <AiStatusDisabledProvider>{children}</AiStatusDisabledProvider>
        </AiEmbeddingProgressDisabledProvider>
    </LlmDisabledProvider>
);
