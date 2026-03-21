import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { transactionService } from '../service/transaction.service';

export const useDeleteTransaction = () => {
    const { t } = useLingui();

    const deleteTransaction = async (transactionId: number) => {
        const confirmed = await confirmAlert({
            title: t`Are you sure?`,
            message: t`This action cannot be undone.`,
            confirmText: t`Delete`,
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
                text1: t`Could not delete transaction.`,
                text2: getErrorMessage(error)
            });
        }
    };

    return deleteTransaction;
};
