import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import { useAccountSelection } from './use-account-selection.hook';

export const useBankAccountSetupFlow = (setupSync: (selectedAccountIds: string[]) => Promise<unknown>) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const accountSelection = useAccountSelection();

    const handleGoBack = () => void goBackOrReplace('/');

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await setupSync([...accountSelection.selectedAccounts]);
            router.replace('/');
        } catch (error) {
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || accountSelection.selectedAccounts.size === 0;

    return { ...accountSelection, isLoading, setIsLoading, handleGoBack, handleSetupSync, isStartSyncDisabled };
};
