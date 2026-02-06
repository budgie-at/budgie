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

    useEffect(() => {
        const clearDebounceTimer = (): void => {
            if (isDefined(debounceTimerRef.current)) {
                clearTimeout(debounceTimerRef.current);
            }
        };

        if (!isReady) {
            return emptyFn;
        }

        const isInitialFetch = lastFetchedAmountRef.current === null;
        const hasAmountChanged = isPositiveNumber(amount) && lastFetchedAmountRef.current !== amount;
        const shouldFetch = isInitialFetch || hasAmountChanged;

        if (!shouldFetch) {
            return emptyFn;
        }

        clearDebounceTimer();

        const fetchSuggestions = async (): Promise<void> => {
            setInternalStatus('loading');
            lastFetchedAmountRef.current = amount;

            try {
                const results = await repeatedTransactionService.getSuggestions({
                    currentTime: currentTimeRef.current,
                    type,
                    accountId,
                    ...(isPositiveNumber(amount) && { amount }),
                    ...(isPositiveNumber(categoryId) && { categoryId })
                });

                setSuggestions(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch {
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

    return { status, suggestions, source: null };
};
