import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useAiEmbeddingProgress } from './use-ai-embedding-progress.hook';

interface UseSuggestionBaseParams<T> {
    readonly enabled: boolean;
    readonly readyChecks: readonly boolean[];
    readonly requestKeyParts: readonly unknown[];
    readonly fetchSuggestions: () => Promise<T[]>;
}

interface UseSuggestionBaseReturn<T> extends UseSuggestionReturnInterface<T> {
    readonly refresh: () => void;
}

export const useSuggestionBase = <T>(params: UseSuggestionBaseParams<T>): UseSuggestionBaseReturn<T> => {
    const { enabled, readyChecks, requestKeyParts, fetchSuggestions } = params;
    const requestKey = JSON.stringify(requestKeyParts);
    const isReady = enabled && readyChecks.every(isCheckReady => isCheckReady);

    const [result, setResult] = useState<{ key: string | null; status: SuggestionInternalStatus; suggestions: T[] }>({
        key: null,
        status: 'idle',
        suggestions: []
    });
    const [refreshVersion, setRefreshVersion] = useState(0);
    const fetchSuggestionsRef = useRef(fetchSuggestions);
    const { isIncomplete } = useAiEmbeddingProgress();
    const previousIncompleteRef = useRef(isIncomplete);

    useEffect(() => {
        fetchSuggestionsRef.current = fetchSuggestions;
    }, [fetchSuggestions]);

    useEffect(() => {
        console.log(`[SugBase] isIncomplete transition: ${previousIncompleteRef.current} → ${isIncomplete}`);
        if (previousIncompleteRef.current && !isIncomplete) {
            console.log('[SugBase] embedding complete transition detected, bumping refreshVersion');
            setRefreshVersion(version => version + 1);
        }
        previousIncompleteRef.current = isIncomplete;
    }, [isIncomplete]);

    useEffect(() => {
        if (!isReady) {
            return emptyFn;
        }

        let cancelled = false;

        const suggest = async (): Promise<void> => {
            setResult({ key: requestKey, status: 'loading', suggestions: [] });

            try {
                const results = await fetchSuggestionsRef.current();

                if (!cancelled) {
                    setResult({ key: requestKey, status: 'success', suggestions: results });
                }
            } catch {
                if (!cancelled) {
                    setResult({ key: requestKey, status: 'error', suggestions: [] });
                }
            }
        };

        void suggest();

        return () => {
            cancelled = true;
        };
    }, [isReady, requestKey, refreshVersion]);

    const keysMatch = result.key === requestKey;
    const currentResult = keysMatch
        ? result
        : {
              key: requestKey,
              status: 'idle' as SuggestionInternalStatus,
              suggestions: [] as T[]
          };

    console.log(
        `[SugBase] keysMatch=${keysMatch} resultKey=${result.key?.slice(0, 60)} requestKey=${requestKey.slice(0, 60)} resultStatus=${result.status} resultSuggestions=${result.suggestions.length}`
    );

    const isInitializing = enabled && !isReady && currentResult.status === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : currentResult.status;

    console.log(
        `[SugBase] enabled=${enabled} isReady=${isReady} checks=[${readyChecks.join(',')}] resultStatus=${currentResult.status} finalStatus=${status} key=${requestKey.slice(0, 80)}`
    );

    const refresh = useCallback((): void => {
        setRefreshVersion(version => version + 1);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    return { status, suggestions: currentResult.suggestions, refresh };
};
