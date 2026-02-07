import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

interface UseSuggestionBaseParams<T> {
    enabled: boolean;
    isReady: boolean;
    fetchSuggestions: () => Promise<T[]>;
}

export const useSuggestionBase = <T>(params: UseSuggestionBaseParams<T>): UseSuggestionReturnInterface<T> => {
    const { enabled, isReady, fetchSuggestions } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<T[]>([]);

    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        console.log('[AI-DEBUG] useSuggestionBase effect:', { enabled, isReady, hasTriggered: hasTriggeredRef.current }); // eslint-disable-line no-console -- Temporary debug
        if (!isReady || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;
        console.log('[AI-DEBUG] useSuggestionBase triggering fetch'); // eslint-disable-line no-console -- Temporary debug

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const results = await fetchSuggestions();

                console.log('[AI-DEBUG] useSuggestionBase results:', results.length); // eslint-disable-line no-console -- Temporary debug
                setSuggestions(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch (error) {
                console.log('[AI-DEBUG] useSuggestionBase error:', error); // eslint-disable-line no-console -- Temporary debug
                setInternalStatus('error');
            }
        };

        void suggest();
    }, [isReady, fetchSuggestions]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
