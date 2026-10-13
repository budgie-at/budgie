import { RefundConsolidationService } from '@budgie/consolidation';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { getErrorMessage } from '@rnw-community/shared';

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
    const language = useSetting('language');
    const result = useAtomValue(refundableExpenseCandidatesAtom([refundIncomeTransactionId, search, language]));
    const candidates = AsyncResult.isSuccess(result) ? result.value : [];
    const errorMessage = AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null;

    return { candidates, errorMessage, isLoading: result.waiting };
};
