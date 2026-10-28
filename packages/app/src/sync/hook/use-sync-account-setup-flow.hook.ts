import { resolveSyncErrorCode } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { useOnboardingRedirect } from '../../onboarding/hook/use-onboarding-redirect.hook';

import { useAccountSelection } from './use-account-selection.hook';
import { useSyncErrorLabels } from './use-sync-error-labels.hook';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type { SyncAccountPreviewInterface } from '@budgie/sync';
import type * as Context from 'effect/Context';

export const useSyncAccountSetupFlow = <Identifier extends AppServices, Shape>(
    service: Context.Key<Identifier, Shape>,
    setupSync: (syncService: Shape, selectedAccountIds: string[]) => Effect.Effect<unknown, unknown, AppServices>
) => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();
    const accountSelection = useAccountSelection();
    const onboardingHref = useOnboardingRedirect();
    const syncErrorLabels = useSyncErrorLabels();

    const exitHref = onboardingHref ?? '/';

    const explainError = (error: unknown) => {
        const errorCode = resolveSyncErrorCode(error);

        return isDefined(errorCode) ? new Error(syncErrorLabels[errorCode]) : error;
    };

    const handleGoBack = () => void goBackOrReplace(exitHref);

    const handleSetupSync = () =>
        run(
            Effect.gen(function* () {
                const syncService = yield* service;
                yield* setupSync(syncService, [...accountSelection.selectedAccounts]);
                router.dismissTo(exitHref);
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not set up sync`))
        );

    const fetchAccountPreviews = (
        loadPreviews: (syncService: Shape) => Effect.Effect<SyncAccountPreviewInterface[] | null, unknown, AppServices>,
        onLoaded: (previews: SyncAccountPreviewInterface[]) => void
    ) =>
        run(
            Effect.gen(function* () {
                const previews = yield* Effect.flatMap(service, loadPreviews);
                if (isDefined(previews)) {
                    onLoaded(previews);
                }
            }).pipe(Effect.mapError(explainError), toastOnFailure(t`Could not fetch accounts`))
        );

    const isStartSyncDisabled = isLoading || accountSelection.selectedAccounts.size === 0;

    return { accountSelection, isLoading, fetchAccountPreviews, handleGoBack, handleSetupSync, isStartSyncDisabled };
};
