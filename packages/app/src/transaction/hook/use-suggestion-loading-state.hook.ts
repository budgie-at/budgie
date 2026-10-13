import { SuggestionStatus } from '@budgie/ai';
import * as Effect from 'effect/Effect';
import { useEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';

const LOADING_DELAY_MS = 400;

interface UseSuggestionLoadingStateParams {
    readonly status: SuggestionStatus;
    readonly hasResults: boolean;
    readonly enabled: boolean;
}

interface UseSuggestionLoadingStateReturn {
    readonly showLoading: boolean;
    readonly showContent: boolean;
    readonly isProcessing: boolean;
}

export const useSuggestionLoadingState = (params: UseSuggestionLoadingStateParams): UseSuggestionLoadingStateReturn => {
    const { status, hasResults, enabled } = params;

    const [showLoading, setShowLoading] = useState(false);

    const isProcessing = status === 'initializing' || status === 'loading';
    const isReady = status === 'success' && hasResults;

    useEffect(() => {
        if (!isProcessing) {
            return emptyFn;
        }

        const fiber = appRuntime.runFork(
            Effect.sleep(LOADING_DELAY_MS).pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        setShowLoading(true);
                    })
                )
            )
        );

        return () => {
            fiber.interruptUnsafe();
            setShowLoading(false);
        };
    }, [isProcessing]);

    const showLoadingIndicator = showLoading && !isReady;
    const showContent = enabled && (showLoadingIndicator || isReady);

    return { showLoading: showLoadingIndicator, showContent, isProcessing };
};
