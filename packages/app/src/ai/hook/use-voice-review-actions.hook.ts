import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useMorphingSheetCommit } from '../../@generic/hook/use-morphing-sheet-commit.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';

import type { ModalResult } from '../../@generic/type/modal-result.type';
import type { UseVoiceReviewReturnInterface } from '../interface/use-voice-review-return.interface';

export const useVoiceReviewActions = (
    saveAll: UseVoiceReviewReturnInterface['saveAll'],
    accountId: number | null,
    onCommit: (result: ModalResult<'/voice-review'>) => void
) => {
    const commit = useMorphingSheetCommit(onCommit);

    const handleCancel = () => void commit({ kind: 'cancelled' });

    const handleReRecord = () => void commit({ kind: 're-record' });

    const handleSave = () => {
        if (!isPositiveNumber(accountId)) {
            return;
        }

        appRuntime.runFork(
            saveAll(accountId).pipe(
                Effect.tap(result =>
                    Effect.sync(() => {
                        if (isDefined(result)) {
                            commit({
                                kind: 'saved',
                                transactionIds: result.transactions.map(transaction => transaction.id),
                                accountId: result.destinationAccountId
                            });
                        }
                    })
                )
            )
        );
    };

    return { handleCancel, handleReRecord, handleSave };
};
