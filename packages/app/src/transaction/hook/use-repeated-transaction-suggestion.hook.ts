import { SuggestionInternalStatus, SuggestionStatus, UseSuggestionReturnInterface } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { repeatedTransactionService } from '../service/repeated-transaction.service';

const DEBOUNCE_MS = 300;

interface UseRepeatedTransactionSuggestionParams {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
}

// eslint-disable-next-line max-statements -- Hook coordinates debounce, focus refresh, and async suggestion fetch lifecycle
export const useRepeatedTransactionSuggestion = (
    params: UseRepeatedTransactionSuggestionParams
): UseSuggestionReturnInterface<RepeatedTransactionPatternInterface> => {
    const { enabled, type, accountId, amount, categoryId } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<RepeatedTransactionPatternInterface[]>([]);
    const [refreshVersion, setRefreshVersion] = useState(0);

    const currentTimeRef = useRef(new Date());
    const lastAmountRef = useRef<number | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isReady = enabled && isPositiveNumber(accountId);
    const amountOrNull = isPositiveNumber(amount) ? amount : null;
    const categoryIdOrNull = isPositiveNumber(categoryId) ? categoryId : null;
    const requestKey = JSON.stringify({
        type,
        accountId,
        amount: amountOrNull,
        categoryId: categoryIdOrNull,
        refreshVersion
    });

    useFocusEffect(() => {
        setRefreshVersion(version => version + 1);
    });

    useEffect(() => {
        const clearDebounceTimer = (): void => {
            if (isDefined(debounceTimerRef.current)) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };

        if (!isReady) {
            return emptyFn;
        }

        const shouldDebounce = isDefined(lastAmountRef.current) && lastAmountRef.current !== amountOrNull;
        lastAmountRef.current = amountOrNull;

        clearDebounceTimer();

        let cancelled = false;
        const fetchSuggestions = async (): Promise<void> => {
            setInternalStatus('loading');
            currentTimeRef.current = new Date();

            try {
                const queryParams = {
                    currentTime: currentTimeRef.current,
                    type,
                    accountId,
                    ...(isDefined(amountOrNull) && { amount: amountOrNull }),
                    ...(isDefined(categoryIdOrNull) && { categoryId: categoryIdOrNull })
                };

                const results = await repeatedTransactionService.getSuggestions(queryParams);

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

        if (shouldDebounce) {
            debounceTimerRef.current = setTimeout(() => void fetchSuggestions(), DEBOUNCE_MS);
        } else {
            void fetchSuggestions();
        }

        return () => {
            cancelled = true;
            clearDebounceTimer();
        };
    }, [isReady, type, accountId, amountOrNull, categoryIdOrNull, requestKey]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
