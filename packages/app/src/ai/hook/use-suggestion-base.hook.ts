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
    const fetchSuggestionsRef = useRef(fetchSuggestions);

    useEffect(() => {
        fetchSuggestionsRef.current = fetchSuggestions;
    });

    useEffect(() => {
        if (!isReady || hasTriggeredRef.current) {
            return emptyFn;
        }

        let cancelled = false;
        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const results = await fetchSuggestionsRef.current();

                if (!cancelled) {
                    setSuggestions(results);
                    setInternalStatus('success');
                }
            } catch {
                if (!cancelled) {
                    setInternalStatus('error');
                }
            }
        };

        void suggest();

        return () => {
            cancelled = true;
        };
    }, [isReady]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
