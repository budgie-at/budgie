import { useLingui } from '@lingui/react/macro';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { transactionService } from '../service/transaction.service';

import type { EmptyFn } from '@rnw-community/shared';

export const useRevertConsolidation = (transactionId: number, onSuccess?: EmptyFn) => {
    const { t } = useLingui();

    const revertConsolidationAsync = async () => {
        const confirmed = await confirmAlert({
            title: t`Revert consolidation?`,
            message: t`This will restore the original transactions and remove the consolidated transaction.`,
            confirmText: t`Revert`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        try {
            await transactionService.unconsolidateById(transactionId);
            onSuccess?.();
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not revert consolidation.`,
                text2: getErrorMessage(error)
            });
        }
    };

    const revertConsolidation = () => {
        void revertConsolidationAsync();
    };

    return revertConsolidation;
};
