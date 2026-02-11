import { SuggestionStatus } from '@budgie/ai';
import { useEffect, useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

const LOADING_DELAY_MS = 400;

interface UseSuggestionLoadingStateParams {
    readonly status: SuggestionStatus;
    readonly hasResults: boolean;
    readonly enabled: boolean;
}

interface UseSuggestionLoadingStateReturn {
    readonly showLoading: boolean;
    readonly showContent: boolean;
    readonly markSelected: () => void;
}

export const useSuggestionLoadingState = (params: UseSuggestionLoadingStateParams): UseSuggestionLoadingStateReturn => {
    const { status, hasResults, enabled } = params;

    const [showLoading, setShowLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasProcessingRef = useRef(false);

    const isProcessing = status === 'initializing' || status === 'loading';
    const isReady = status === 'success' && hasResults;

    useEffect(() => {
        if (isDefined(timerRef.current)) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isProcessing && !wasProcessingRef.current) {
            wasProcessingRef.current = true;
            timerRef.current = setTimeout(() => {
                setShowLoading(true);
                timerRef.current = null;
            }, LOADING_DELAY_MS);
        }

        if (!isProcessing && wasProcessingRef.current) {
            wasProcessingRef.current = false;
            timerRef.current = setTimeout(() => {
                setShowLoading(false);
                timerRef.current = null;
            }, 0);
        }

        return () => {
            if (isDefined(timerRef.current)) {
                clearTimeout(timerRef.current);
            }
        };
    }, [isProcessing]);

    const showLoadingIndicator = showLoading && !isReady;
    const showContent = enabled && (showLoadingIndicator || isReady);

    console.log(
        `[LoadState] status=${status} hasResults=${hasResults} enabled=${enabled} isProcessing=${isProcessing} isReady=${isReady} showLoading=${showLoadingIndicator} showContent=${showContent}`
    );

    return { showLoading: showLoadingIndicator, showContent, markSelected: () => void 0 };
};
