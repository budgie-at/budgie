import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { LoggerNamespaceEnum, getLogger } from '@budgie/contracts';
import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { EMBEDDING_COMPLETENESS_THRESHOLD } from '../constant/embedding-completeness-threshold.constant';

const logger = getLogger(LoggerNamespaceEnum.AI);

import { useEmbeddingProgressSnapshot } from './use-embedding-progress-snapshot.hook';

interface UseSuggestionBaseParams<T> {
    readonly enabled: boolean;
    readonly readyChecks: readonly boolean[];
    readonly requestKeyParts: readonly unknown[];
    readonly fetchSuggestions: () => Promise<T[]>;
}

interface UseSuggestionBaseReturn<T> extends UseSuggestionReturnInterface<T> {
    readonly refresh: () => void;
}

interface SuggestionResultInterface<T> {
    readonly key: string | null;
    readonly status: SuggestionInternalStatus;
    readonly suggestions: T[];
}

// eslint-disable-next-line max-statements -- Hook coordinates focus refresh, async suggestion fetch, and state management
export const useSuggestionBase = <T>(params: UseSuggestionBaseParams<T>): UseSuggestionBaseReturn<T> => {
    const { enabled, readyChecks, requestKeyParts, fetchSuggestions } = params;
    const requestKey = JSON.stringify(requestKeyParts);
    const isReady = enabled && readyChecks.every(isCheckReady => isCheckReady);

    const [result, setResult] = useState<SuggestionResultInterface<T>>({
        key: null,
        status: 'idle',
        suggestions: []
    });
    const [refreshVersion, setRefreshVersion] = useState(0);
    const fetchSuggestionsRef = useRef(fetchSuggestions);
    const navigation = useNavigation();
    const { percent: progress } = useEmbeddingProgressSnapshot();
    const isIncomplete = progress < EMBEDDING_COMPLETENESS_THRESHOLD;

    useEffect(() => {
        fetchSuggestionsRef.current = fetchSuggestions;
    }, [fetchSuggestions]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshVersion(version => version + 1);
        });

        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        logger.log('hook:suggestion:base:effect:fire', { isReady, enabled, progress, isIncomplete, refreshVersion, requestKey });
        if (!isReady) {
            logger.log('hook:suggestion:base:effect:skip:not-ready', {
                enabled,
                readyChecks: [...readyChecks],
                readyCheckFailAt: readyChecks.findIndex(check => !check)
            });

            return emptyFn;
        }

        let cancelled = false;

        const suggest = async (): Promise<void> => {
            logger.log('hook:suggestion:base:suggest:loading', { requestKey });
            setResult({ key: requestKey, status: 'loading', suggestions: [] });

            try {
                const results = await fetchSuggestionsRef.current();

                if (!cancelled) {
                    logger.log('hook:suggestion:base:suggest:success', { requestKey, resultCount: results.length });
                    setResult({ key: requestKey, status: 'success', suggestions: results });
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    logger.error('hook:suggestion:base:suggest:error', {
                        requestKey,
                        message: getErrorMessage(error)
                    });
                    setResult({ key: requestKey, status: 'error', suggestions: [] });
                }
            }
        };

        void suggest();

        return () => {
            cancelled = true;
        };
    }, [isReady, requestKey, refreshVersion, isIncomplete]);

    const currentResult: SuggestionResultInterface<T> =
        result.key === requestKey ? result : { key: requestKey, status: 'idle', suggestions: [] };

    const isInitializing = enabled && !isReady && currentResult.status === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : currentResult.status;

    const refresh = (): void => {
        setRefreshVersion(version => version + 1);
    };

    return { status, suggestions: currentResult.suggestions, refresh };
};
