import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

import { useAccountSelection } from './use-account-selection.hook';

export const useSyncAccountSetupFlow = (setupSync: (selectedAccountIds: string[]) => Promise<unknown>) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const accountSelection = useAccountSelection();
    const onboardingHref = useOnboardingRedirect();

    const exitHref = onboardingHref ?? '/';

    const handleGoBack = () => void goBackOrReplace(exitHref);

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await setupSync([...accountSelection.selectedAccounts]);
            router.replace(exitHref);
        } catch (error) {
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || accountSelection.selectedAccounts.size === 0;

    return { ...accountSelection, isLoading, setIsLoading, handleGoBack, handleSetupSync, isStartSyncDisabled };
};
