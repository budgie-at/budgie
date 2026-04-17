import { ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { AiEmbeddingProgressProvider } from './ai-embedding-progress.provider';
import { AiStatusProvider } from './ai-status.provider';
import { DisabledAiStackProvider } from './disabled-ai-stack.provider';

interface Props {
    readonly children: ReactNode;
}

const LazyLlmProvider = lazy(async () => {
    const { LlmProvider } = await import('./llm.provider');

    return { default: LlmProvider };
});

export const ConditionalLlmProvider = ({ children }: Props) => {
    const [isActivated, setIsActivated] = useState(AppState.currentState === 'active');

    useEffect(() => {
        if (isActivated) {
            return emptyFn;
        }

        const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                setIsActivated(true);
                subscription.remove();
            }
        });

        return () => void subscription.remove();
    }, [isActivated]);

    if (!isActivated) {
        return <DisabledAiStackProvider>{children}</DisabledAiStackProvider>;
    }

    return (
        <Suspense fallback={<DisabledAiStackProvider>{children}</DisabledAiStackProvider>}>
            <LazyLlmProvider>
                <AiEmbeddingProgressProvider>
                    <AiStatusProvider>{children}</AiStatusProvider>
                </AiEmbeddingProgressProvider>
            </LazyLlmProvider>
        </Suspense>
    );
};
