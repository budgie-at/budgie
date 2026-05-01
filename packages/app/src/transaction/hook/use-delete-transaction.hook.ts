import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { transactionService } from '../service/transaction.service';

import type { DeleteTransactionOptionsInterface } from '../interface/delete-transaction-options.interface';

export const useDeleteTransaction = () => {
    const { t } = useLingui();

    const deleteTransaction = async (transactionId: number, options?: DeleteTransactionOptionsInterface) => {
        const isConsolidated = options?.isConsolidated === true;
        const title = isConsolidated ? t`Unconsolidate transaction?` : t`Are you sure?`;
        const message = isConsolidated
            ? t`Original imported transactions will be restored and the consolidated transaction will be removed.`
            : t`This action cannot be undone.`;
        const confirmText = isConsolidated ? t`Unconsolidate` : t`Delete`;
        const errorText = isConsolidated ? t`Could not unconsolidate transaction.` : t`Could not delete transaction.`;

        const confirmed = await confirmAlert({
            title,
            message,
            confirmText,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        try {
            await transactionService.deleteById(transactionId);
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: errorText,
                text2: getErrorMessage(error)
            });
        }
    };

    return deleteTransaction;
};
