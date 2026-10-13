import { SuggestionStatus } from '@budgie/ai';
import { LanguageEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useEffect, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFocusRefreshVersion } from '../../@generic/hook/use-focus-refresh-version.hook';
import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { PatternSuggestionsResultInterface } from '../interface/pattern-suggestions-result.interface';
import { RepeatedTransactionService } from '../service/repeated-transaction.service';

const DEBOUNCE_MS = 600;

interface UseRepeatedTransactionSuggestionParams {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
}

const repeatedTransactionSuggestionsAtom = Atom.family(
    ([type, accountId, amount, categoryId, language]: readonly [
        TransactionTypeEnum,
        number,
        number | null,
        number | null,
        LanguageEnum,
        number
    ]) =>
        appAtomRuntime.atom(
            isPositiveNumber(accountId)
                ? Effect.flatMap(RepeatedTransactionService, repeatedTransactionService =>
                      repeatedTransactionService.getSuggestions({
                          currentTime: new Date(),
                          type,
                          language,
                          accountId,
                          ...(isDefined(amount) && { amount }),
                          ...(isDefined(categoryId) && { categoryId })
                      })
                  ).pipe(Effect.tapError(Effect.logError))
                : Effect.succeed({ timePatterns: [], amountPatterns: [] })
        )
);

export const useRepeatedTransactionSuggestion = (params: UseRepeatedTransactionSuggestionParams): PatternSuggestionsResultInterface => {
    const { enabled, type, accountId, amount, categoryId } = params;
    const language = useSetting('language');
    const { refreshVersion } = useFocusRefreshVersion();
    const amountOrNull = isPositiveNumber(amount) ? amount : null;
    const [debouncedAmount, setDebouncedAmount] = useState(amountOrNull);

    useEffect(() => {
        const fiber = appRuntime.runFork(
            Effect.sleep(DEBOUNCE_MS).pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        setDebouncedAmount(amountOrNull);
                    })
                )
            )
        );

        return () => void fiber.interruptUnsafe();
    }, [amountOrNull]);

    const isReady = enabled && isPositiveNumber(accountId);
    const result = useAtomValue(
        repeatedTransactionSuggestionsAtom([
            type,
            isReady ? accountId : 0,
            debouncedAmount,
            isPositiveNumber(categoryId) ? categoryId : null,
            language,
            refreshVersion
        ])
    );

    if (!isReady) {
        return { status: enabled ? 'initializing' : 'idle', timePatterns: [], amountPatterns: [] };
    }

    if (AsyncResult.isSuccess(result)) {
        return { status: 'success', timePatterns: result.value.timePatterns, amountPatterns: result.value.amountPatterns };
    }

    const status: SuggestionStatus = AsyncResult.isFailure(result) ? 'error' : 'loading';

    return { status, timePatterns: [], amountPatterns: [] };
};
