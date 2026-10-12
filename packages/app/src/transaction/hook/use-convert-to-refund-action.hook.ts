import { RefundConsolidationService } from '@budgie/consolidation';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { runConfirmedTransactionAction } from '../utils/run-confirmed-transaction-action.util';

import type { ConvertToRefundModalResolveType } from '../interface/convert-to-refund-modal-resolve.type';
import type { TransactionPickerItemInterface } from '../interface/transaction-picker-item.interface';

export const useConvertToRefundAction = (
    refundIncomeTransactionId: number,
    selectedCandidate: TransactionPickerItemInterface | null,
    resolveConvertToRefund: ConvertToRefundModalResolveType
) => {
    const { t } = useLingui();

    return async () => {
        if (!isDefined(selectedCandidate)) {
            return;
        }

        await runConfirmedTransactionAction(
            {
                title: t`Convert to Refund?`,
                message: t`This will link the selected expense to this refund income. You can revert it from the refund sources sheet.`,
                confirmText: t`Convert`,
                cancelText: t`Cancel`,
                isDestructive: false
            },
            t`Could not convert to refund`,
            () =>
                Effect.flatMap(RefundConsolidationService, refundConsolidationService =>
                    refundConsolidationService.convertToRefund({ refundIncomeTransactionId, expenseTransactionId: selectedCandidate.id })
                ).pipe(
                    Effect.tap(canonicalId =>
                        Effect.sync(() => {
                            resolveConvertToRefund(canonicalId);
                        })
                    )
                )
        );
    };
};
