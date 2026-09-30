import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { Db } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import { useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useFocusRefreshVersion } from '../../@generic/hook/use-focus-refresh-version.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { EMBEDDING_COMPLETENESS_THRESHOLD } from '../constant/embedding-completeness-threshold.constant';
import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';
import { aiModelResidencyService } from '../service/ai-model-residency.service';
import { embeddingProgressStore } from '../store/embedding-progress.store';

interface UseSuggestionBaseParams<T> {
    readonly enabled: boolean;
    readonly readyChecks: readonly boolean[];
    readonly requestKeyParts: readonly unknown[];
    readonly fetchSuggestions: () => Effect.Effect<T[], unknown, Db>;
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
    const { refresh, refreshVersion } = useFocusRefreshVersion();
    const fetchSuggestionsRef = useRef(fetchSuggestions);
    const progress = useAtomValue(embeddingProgressStore.snapshot, snapshot => snapshot.percent);
    const isEmbeddingIncomplete = progress < EMBEDDING_COMPLETENESS_THRESHOLD;

    useEffect(() => {
        fetchSuggestionsRef.current = fetchSuggestions;
    }, [fetchSuggestions]);

    useEffect(() => {
        if (!enabled) {
            return emptyFn;
        }

        appRuntime.runFork(aiModelResidencyService.acquire(AiSubsystemNameEnum.EMBEDDING));

        return () => {
            appRuntime.runFork(aiModelResidencyService.release(AiSubsystemNameEnum.EMBEDDING));
        };
    }, [enabled]);

    useEffect(() => {
        if (!isReady) {
            return emptyFn;
        }

        const fiber = appRuntime.runFork(
            Effect.sync(() => {
                setResult({ key: requestKey, status: 'loading', suggestions: [] });
            }).pipe(
                Effect.andThen(fetchSuggestionsRef.current()),
                Effect.match({
                    onSuccess: suggestions => {
                        setResult({ key: requestKey, status: 'success', suggestions });
                    },
                    onFailure: () => {
                        setResult({ key: requestKey, status: 'error', suggestions: [] });
                    }
                })
            )
        );

        return () => {
            fiber.interruptUnsafe();
        };
    }, [isReady, requestKey, refreshVersion, isEmbeddingIncomplete]);

    const currentResult: SuggestionResultInterface<T> =
        result.key === requestKey ? result : { key: requestKey, status: 'idle', suggestions: [] };

    const isInitializing = enabled && !isReady && currentResult.status === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : currentResult.status;

    return { status, suggestions: currentResult.suggestions, refresh };
};
