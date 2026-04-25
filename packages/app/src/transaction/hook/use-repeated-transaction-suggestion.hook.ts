import { SuggestionInternalStatus, SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

const logger = getLogger('useRepeatedTransactionSuggestion');
import { PatternSuggestionsResultInterface } from '../interface/pattern-suggestions-result.interface';
import { repeatedTransactionService } from '../service/repeated-transaction.service';

const DEBOUNCE_MS = 600;

interface UseRepeatedTransactionSuggestionParams {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
}

// eslint-disable-next-line max-statements -- Hook coordinates debounce, focus refresh, and async suggestion fetch lifecycle
export const useRepeatedTransactionSuggestion = (params: UseRepeatedTransactionSuggestionParams): PatternSuggestionsResultInterface => {
    const { enabled, type, accountId, amount, categoryId } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [timePatterns, setTimePatterns] = useState<RepeatedTransactionPatternInterface[]>([]);
    const [amountPatterns, setAmountPatterns] = useState<RepeatedTransactionPatternInterface[]>([]);
    const [refreshVersion, setRefreshVersion] = useState(0);

    const navigation = useNavigation();
    const currentTimeRef = useRef(new Date());
    const lastAmountRef = useRef<number | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isReady = enabled && isPositiveNumber(accountId);
    const amountOrNull = isPositiveNumber(amount) ? amount : null;
    const categoryIdOrNull = isPositiveNumber(categoryId) ? categoryId : null;

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshVersion(version => version + 1);
        });

        return unsubscribe;
    }, [navigation]);

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
            const startedAt = Date.now();

            try {
                const queryParams = {
                    currentTime: currentTimeRef.current,
                    type,
                    accountId,
                    ...(isDefined(amountOrNull) && { amount: amountOrNull }),
                    ...(isDefined(categoryIdOrNull) && { categoryId: categoryIdOrNull })
                };

                logger.log('hook:pattern:fetch:begin', queryParams);
                const result = await repeatedTransactionService.getSuggestions(queryParams);
                logger.log('hook:pattern:fetch:done', {
                    durationMs: Date.now() - startedAt,
                    time: result.timePatterns.length,
                    amount: result.amountPatterns.length
                });

                if (!cancelled) {
                    setTimePatterns(result.timePatterns);
                    setAmountPatterns(result.amountPatterns);
                    setInternalStatus('success');
                }
            } catch (error: unknown) {
                logger.error('hook:pattern:fetch:throw', {
                    durationMs: Date.now() - startedAt,
                    errorMessage: getErrorMessage(error)
                });
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
    }, [isReady, type, accountId, amountOrNull, categoryIdOrNull, refreshVersion]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, timePatterns, amountPatterns };
};
