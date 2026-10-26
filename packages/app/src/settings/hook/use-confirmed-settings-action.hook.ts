import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { AppServices } from '../../@generic/runtime/app.runtime';

export const useConfirmedSettingsAction = (confirmOptions: Parameters<typeof confirmAlert>[0], errorTitle: string) => {
    const { isLoading, run: runSingleFlight } = useSingleFlight();

    const run = (action: Effect.Effect<unknown, unknown, AppServices>) =>
        runSingleFlight(async () => {
            const confirmed = await confirmAlert(confirmOptions);

            if (!confirmed) {
                return;
            }

            await appRuntime.runPromise(
                action.pipe(
                    Effect.tapCause(Effect.logError),
                    Effect.catch(error => Effect.sync(() => void showErrorToast(errorTitle, getErrorMessage(error))))
                )
            );
        });

    return { isLoading, run };
};
