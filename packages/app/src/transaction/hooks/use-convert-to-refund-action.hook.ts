import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { transactionRefundService } from '../service/transaction-refund.service';

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

        const confirmed = await confirmAlert({
            title: t`Convert to Refund?`,
            message: t`This will link the selected expense to this refund income. You can revert it from the refund sources sheet.`,
            confirmText: t`Convert`,
            cancelText: t`Cancel`,
            isDestructive: false
        });

        if (!confirmed) {
            return;
        }

        try {
            const canonicalId = await transactionRefundService.convertToRefund({
                refundIncomeTransactionId,
                expenseTransactionId: selectedCandidate.id
            });
            resolveConvertToRefund(canonicalId);
        } catch (error: unknown) {
            Toast.show({ type: 'error', text1: t`Could not convert to refund`, text2: getErrorMessage(error) });
        }
    };
};
