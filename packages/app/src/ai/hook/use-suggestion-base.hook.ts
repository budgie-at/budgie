import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

interface UseSuggestionBaseParams<T> {
    readonly enabled: boolean;
    readonly readyChecks: readonly boolean[];
    readonly requestKeyParts: readonly unknown[];
    readonly fetchSuggestions: () => Promise<T[]>;
}

interface UseSuggestionBaseReturn<T> extends UseSuggestionReturnInterface<T> {
    readonly refresh: () => void;
}

// eslint-disable-next-line max-statements -- Shared suggestion orchestration (request keying, refresh, focus refresh, and status mapping)
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
    const lastFetchKeyRef = useRef<string | null>(null);
    const lastRefreshVersionRef = useRef(0);
    const fetchSuggestionsRef = useRef(fetchSuggestions);

    useEffect(() => {
        fetchSuggestionsRef.current = fetchSuggestions;
    }, [fetchSuggestions]);

    useEffect(() => {
        const hasRequestChanged = lastFetchKeyRef.current !== requestKey;
        const hasRefreshRequested = lastRefreshVersionRef.current !== refreshVersion;

        if (!isReady || (!hasRequestChanged && !hasRefreshRequested)) {
            return emptyFn;
        }

        lastFetchKeyRef.current = requestKey;
        lastRefreshVersionRef.current = refreshVersion;

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

    const currentResult =
        result.key === requestKey
            ? result
            : {
                  key: requestKey,
                  status: 'idle' as SuggestionInternalStatus,
                  suggestions: [] as T[]
              };

    const isInitializing = enabled && !isReady && currentResult.status === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : currentResult.status;

    const refresh = useCallback((): void => {
        if (lastFetchKeyRef.current === null) {
            return;
        }

        setRefreshVersion(version => version + 1);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh])
    );

    return { status, suggestions: currentResult.suggestions, refresh };
};
