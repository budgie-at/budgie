import { RefundConsolidationService } from '@budgie/consolidation';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useDeferredValue } from 'react';

import { getErrorMessage, isEmptyArray } from '@rnw-community/shared';

import { useStickyDefinedValue } from '../../@generic/hook/use-sticky-defined-value.hook';
import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { LanguageEnum } from '@budgie/contracts';

const refundableExpenseCandidatesAtom = Atom.family(
    ([refundIncomeTransactionId, search, language]: readonly [number, string, LanguageEnum]) =>
        appAtomRuntime.atom(
            Effect.flatMap(RefundConsolidationService, refundConsolidationService =>
                refundConsolidationService.findRefundableExpenses(refundIncomeTransactionId, search, language)
            )
        )
);

export const useRefundableExpenseCandidatesQuery = (refundIncomeTransactionId: number, search: string) => {
    const deferredSearch = useDeferredValue(search);
    const language = useSetting('language');
    const atom = refundableExpenseCandidatesAtom([refundIncomeTransactionId, deferredSearch, language]);
    const retry = useAtomRefresh(atom);
    const result = useAtomValue(atom);
    const currentCandidates = AsyncResult.isSuccess(result) ? result.value : void 0;
    const stickyCandidates = useStickyDefinedValue(currentCandidates);
    const isResultLoading = AsyncResult.isInitial(result) || (result.waiting && !AsyncResult.isSuccess(result));
    const isSearchPending = search !== deferredSearch || isResultLoading;
    const errorMessage = AsyncResult.isFailure(result) ? result.cause.pipe(Cause.squash, getErrorMessage) : null;
    const candidates = AsyncResult.isFailure(result) ? [] : (stickyCandidates ?? []);

    return {
        candidates,
        errorMessage,
        retry,
        isLoading: isSearchPending && isEmptyArray(candidates),
        isSearchPending
    };
};
