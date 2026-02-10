import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { repeatedTransactionService } from '../service/repeated-transaction.service';

const DEBOUNCE_MS = 300;

interface UseRepeatedTransactionSuggestionParams {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
}

export const useRepeatedTransactionSuggestion = (
    params: UseRepeatedTransactionSuggestionParams
): UseSuggestionReturnInterface<RepeatedTransactionPatternInterface> => {
    const { enabled, type, accountId, amount, categoryId } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<RepeatedTransactionPatternInterface[]>([]);

    const currentTimeRef = useRef(new Date());
    const lastFetchedAmountRef = useRef<number | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isReady = enabled && isPositiveNumber(accountId);
    /* eslint-disable no-console, lingui/no-unlocalized-strings */
    console.log(
        `[PatternHook] RENDER enabled=${String(enabled)} accountId=${accountId} isReady=${String(isReady)} status=${internalStatus} suggestions=${suggestions.length}`
    );
    /* eslint-enable no-console, lingui/no-unlocalized-strings */

    // eslint-disable-next-line max-statements -- Debug logging in effect
    useEffect(() => {
        const clearDebounceTimer = (): void => {
            if (isDefined(debounceTimerRef.current)) {
                clearTimeout(debounceTimerRef.current);
            }
        };

        if (!isReady) {
            console.log('[PatternHook] NOT READY, skipping'); // eslint-disable-line no-console, lingui/no-unlocalized-strings

            return emptyFn;
        }

        const isInitialFetch = lastFetchedAmountRef.current === null;
        const hasAmountChanged = isPositiveNumber(amount) && lastFetchedAmountRef.current !== amount;
        const shouldFetch = isInitialFetch || hasAmountChanged;
        /* eslint-disable no-console, lingui/no-unlocalized-strings */
        console.log(
            `[PatternHook] amount=${amount} lastFetched=${String(lastFetchedAmountRef.current)} isInitial=${String(isInitialFetch)} hasAmountChanged=${String(hasAmountChanged)} shouldFetch=${String(shouldFetch)} isReady=${String(isReady)}`
        );
        /* eslint-enable no-console, lingui/no-unlocalized-strings */

        if (!shouldFetch) {
            return emptyFn;
        }

        clearDebounceTimer();

        const fetchSuggestions = async (): Promise<void> => {
            const start = performance.now();
            console.log('[PatternSuggest] fetchSuggestions START'); // eslint-disable-line no-console, lingui/no-unlocalized-strings
            setInternalStatus('loading');
            lastFetchedAmountRef.current = amount;
            currentTimeRef.current = new Date();

            try {
                const results = await repeatedTransactionService.getSuggestions({
                    currentTime: currentTimeRef.current,
                    type,
                    accountId,
                    ...(isPositiveNumber(amount) && { amount }),
                    ...(isPositiveNumber(categoryId) && { categoryId })
                });
                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings
                console.log(`[PatternSuggest] done in ${(performance.now() - start).toFixed(0)}ms n=${results.length}`);

                // eslint-disable-next-line no-console, lingui/no-unlocalized-strings
                console.log(`[PatternHook] SET results=${results.length} status=${isNotEmptyArray(results) ? 'success' : 'error'}`);
                setSuggestions(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch (error) {
                console.log('[PatternHook] CATCH error', error); // eslint-disable-line no-console, lingui/no-unlocalized-strings
                setInternalStatus('error');
            }
        };

        if (isInitialFetch) {
            void fetchSuggestions();
        } else {
            debounceTimerRef.current = setTimeout(() => void fetchSuggestions(), DEBOUNCE_MS);
        }

        return clearDebounceTimer;
    }, [isReady, type, accountId, amount, categoryId]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
