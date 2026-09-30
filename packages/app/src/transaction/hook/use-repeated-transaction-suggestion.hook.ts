import { SuggestionInternalStatus, SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { useEffect, useRef, useState } from 'react';

import { emptyFn, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFocusRefreshVersion } from '../../@generic/hook/use-focus-refresh-version.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
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
    const language = useSetting('language');

    const [internalStatus, setInternalStatus] = useState<SuggestionInternalStatus>('idle');
    const [timePatterns, setTimePatterns] = useState<RepeatedTransactionPatternInterface[]>([]);
    const [amountPatterns, setAmountPatterns] = useState<RepeatedTransactionPatternInterface[]>([]);
    const { refreshVersion } = useFocusRefreshVersion();

    const lastAmountRef = useRef<number | null>(null);

    const isReady = enabled && isPositiveNumber(accountId);
    const amountOrNull = isPositiveNumber(amount) ? amount : null;
    const categoryIdOrNull = isPositiveNumber(categoryId) ? categoryId : null;

    useEffect(() => {
        if (!isReady) {
            return emptyFn;
        }

        const shouldDebounce = isDefined(lastAmountRef.current) && lastAmountRef.current !== amountOrNull;
        lastAmountRef.current = amountOrNull;

        const fiber = appRuntime.runFork(
            Effect.gen(function* () {
                if (shouldDebounce) {
                    yield* Effect.sleep(DEBOUNCE_MS);
                }

                setInternalStatus('loading');

                const result = yield* repeatedTransactionService.getSuggestions({
                    currentTime: new Date(),
                    type,
                    language,
                    accountId,
                    ...(isDefined(amountOrNull) && { amount: amountOrNull }),
                    ...(isDefined(categoryIdOrNull) && { categoryId: categoryIdOrNull })
                });

                setTimePatterns(result.timePatterns);
                setAmountPatterns(result.amountPatterns);
                setInternalStatus('success');
            }).pipe(
                Effect.tapError(Effect.logError),
                Effect.catch(() => Effect.sync(() => void setInternalStatus('error')))
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [isReady, type, accountId, amountOrNull, categoryIdOrNull, refreshVersion, language]);

    const isInitializing = enabled && !isReady && internalStatus === 'idle';
    const status: SuggestionStatus = isInitializing ? 'initializing' : internalStatus;

    return { status, timePatterns, amountPatterns };
};
