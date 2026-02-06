import { SuggestionInternalStatus, SuggestionSource, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

interface FetchSuggestionsResultInterface<T> {
    readonly results: T[];
    readonly source: SuggestionSource;
}

interface UseSuggestionBaseParams<T> {
    enabled: boolean;
    isReady: boolean;
    fetchSuggestions: () => Promise<FetchSuggestionsResultInterface<T>>;
}

export const useSuggestionBase = <T>(params: UseSuggestionBaseParams<T>): UseSuggestionReturnInterface<T> => {
    const { enabled, isReady, fetchSuggestions } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<T[]>([]);
    const [source, setSource] = useState<SuggestionSource | null>(null);

    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        if (!isReady || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;

        const suggest = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const fetchResult = await fetchSuggestions();

                setSuggestions(fetchResult.results);
                setSource(fetchResult.source);
                setInternalStatus(isNotEmptyArray(fetchResult.results) ? 'success' : 'error');
            } catch {
                setInternalStatus('error');
            }
        };

        void suggest();
    }, [isReady, fetchSuggestions]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions, source };
};
