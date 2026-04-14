import { ReactNode, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { AiEmbeddingProgressProvider } from './ai-embedding-progress.provider';
import { AiStatusProvider } from './ai-status.provider';
import { DisabledAiStackProvider } from './disabled-ai-stack.provider';

interface Props {
    readonly children: ReactNode;
}

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

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports -- Dynamic require prevents Metal GPU initialization at module load in background */
    const { LlmProvider } = require('./llm.provider');
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */

    return (
        <LlmProvider>
            <AiEmbeddingProgressProvider>
                <AiStatusProvider>{children}</AiStatusProvider>
            </AiEmbeddingProgressProvider>
        </LlmProvider>
    );
};
