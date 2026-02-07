import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { useEffect, useRef, useState } from 'react';

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

    useEffect(() => {
        let cancelled = false;

        if (isReady && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;

            const suggest = async (): Promise<void> => {
                setInternalStatus('loading');

                try {
                    const results = await fetchSuggestions();

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
        }

        return () => {
            cancelled = true;
        };
    }, [isReady, fetchSuggestions]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
