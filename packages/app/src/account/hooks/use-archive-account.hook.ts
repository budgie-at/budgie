import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { EmptyFn, getErrorMessage } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { accountService } from '../service/account.service';

export const useArchiveAccount = (accountId: number, onArchived: EmptyFn) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);

    const handleArchive = async () => {
        const confirmed = await confirmAlert({
            title: t`Archive Account?`,
            message: t`This account will be hidden from your main view and won't be included in totals. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Archive`,
            cancelText: t`Cancel`,
            isDestructive: false
        });

        if (!confirmed) {
            return;
        }

        setIsLoading(true);
        try {
            await accountService.archiveById(accountId);
            onArchived();
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Could not archive account`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return { handleArchive, isLoading };
};
