import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface UseSuggestionBaseParams<T> {
    readonly enabled: boolean;
    readonly isReady: boolean;
    readonly fetchSuggestions: () => Promise<T[]>;
}

export const useSuggestionBase = <T>(params: UseSuggestionBaseParams<T>): UseSuggestionReturnInterface<T> => {
    const { enabled, isReady, fetchSuggestions } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<T[]>([]);

    const hasTriggeredRef = useRef(false);
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;

    // eslint-disable-next-line no-console
    console.log('[useSuggestionBase] render', {
        render: renderCountRef.current,
        enabled,
        isReady,
        internalStatus,
        hasTriggered: hasTriggeredRef.current,
        suggestionsCount: suggestions.length
    });

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('[useSuggestionBase] effect', { isReady, hasTriggered: hasTriggeredRef.current });

        if (!isReady || hasTriggeredRef.current) {
            // eslint-disable-next-line no-console
            console.log('[useSuggestionBase] skipped', { reason: !isReady ? 'not ready' : 'already triggered' });

            return emptyFn;
        }

        let cancelled = false;
        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            // eslint-disable-next-line no-console
            console.log('[useSuggestionBase] fetching...');
            setInternalStatus('loading');

            try {
                const results = await fetchSuggestions();

                // eslint-disable-next-line no-console
                console.log('[useSuggestionBase] fetched', { cancelled, resultsCount: results.length });

                if (!cancelled) {
                    setSuggestions(results);
                    setInternalStatus('success');
                }
            } catch {
                // eslint-disable-next-line no-console
                console.log('[useSuggestionBase] error', { cancelled });
                if (!cancelled) {
                    setInternalStatus('error');
                }
            }
        };

        void suggest();

        return () => {
            // eslint-disable-next-line no-console
            console.log('[useSuggestionBase] cleanup, resetting hasTriggered');
            cancelled = true;
            hasTriggeredRef.current = false;
        };
    }, [isReady, fetchSuggestions]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    // eslint-disable-next-line no-console
    console.log('[useSuggestionBase] status', { status, isInitializing, internalStatus });

    return { status, suggestions };
};
