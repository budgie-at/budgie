import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

import { useAccountSelection } from './use-account-selection.hook';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { SyncAccountPreviewInterface } from '@budgie/sync';
import type * as Context from 'effect/Context';

export const useSyncAccountSetupFlow = <Identifier extends AppServices, Shape>(
    service: Context.Key<Identifier, Shape>,
    setupSync: (syncService: Shape, selectedAccountIds: string[]) => Effect.Effect<unknown, unknown, AppServices>
) => {
    const { t } = useLingui();
    const [isLoading, setIsLoading] = useState(false);
    const accountSelection = useAccountSelection();
    const onboardingHref = useOnboardingRedirect();

    const exitHref = onboardingHref ?? '/';

    const handleGoBack = () => void goBackOrReplace(exitHref);

    const handleSetupSync = async () => {
        setIsLoading(true);
        try {
            await appRuntime.runPromise(
                Effect.flatMap(service, syncService => setupSync(syncService, [...accountSelection.selectedAccounts]))
            );
            router.replace(exitHref);
        } catch (error) {
            showErrorToast(t`Could not set up sync`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAccountPreviews = async (
        loadPreviews: (syncService: Shape) => Effect.Effect<SyncAccountPreviewInterface[], unknown, AppServices>,
        onLoaded: (previews: SyncAccountPreviewInterface[]) => void
    ) => {
        setIsLoading(true);
        try {
            onLoaded(await appRuntime.runPromise(Effect.flatMap(service, loadPreviews)));
        } catch (error) {
            showErrorToast(t`Could not fetch accounts`, getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const isStartSyncDisabled = isLoading || accountSelection.selectedAccounts.size === 0;

    return { ...accountSelection, isLoading, fetchAccountPreviews, handleGoBack, handleSetupSync, isStartSyncDisabled };
};
