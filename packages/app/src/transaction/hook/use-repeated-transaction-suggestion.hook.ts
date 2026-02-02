import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SuggestionInternalStatus } from '../../ai/interface/suggestion-internal-status.type';
import { SuggestionStatus } from '../../ai/interface/suggestion-status.type';
import { UseSuggestionReturnInterface } from '../../ai/interface/use-suggestion-return.interface';
import { repeatedTransactionService } from '../service/repeated-transaction.service';

interface UseRepeatedTransactionSuggestionParams {
    enabled: boolean;
    type: TransactionTypeEnum;
    accountId: number;
    amount: number;
    categoryId: number;
}

export const useRepeatedTransactionSuggestion = (
    params: UseRepeatedTransactionSuggestionParams
): UseSuggestionReturnInterface<RepeatedTransactionPatternInterface> => {
    const { enabled, type, accountId, amount, categoryId } = params;

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [suggestions, setSuggestions] = useState<RepeatedTransactionPatternInterface[]>([]);

    const hasTriggeredRef = useRef(false);
    const currentTimeRef = useRef(new Date());

    const isReady = enabled && isPositiveNumber(accountId);

    useEffect(() => {
        if (!isReady || hasTriggeredRef.current) {
            return;
        }

        hasTriggeredRef.current = true;

        const fetchSuggestions = async (): Promise<void> => {
            setInternalStatus('loading');

            try {
                const results = await repeatedTransactionService.getSuggestions({
                    currentTime: currentTimeRef.current,
                    type,
                    accountId: isPositiveNumber(accountId) ? accountId : undefined,
                    amount: isPositiveNumber(amount) ? amount : undefined,
                    categoryId: isPositiveNumber(categoryId) ? categoryId : undefined
                });

                setSuggestions(results);
                setInternalStatus(isNotEmptyArray(results) ? 'success' : 'error');
            } catch {
                setInternalStatus('error');
            }
        };

        void fetchSuggestions();
    }, [isReady, type, accountId, amount, categoryId]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, suggestions };
};
