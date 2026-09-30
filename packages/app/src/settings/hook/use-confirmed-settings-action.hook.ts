import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';

import type { AppServices } from '../../@generic/runtime/app.runtime';

export const useConfirmedSettingsAction = (confirmOptions: Parameters<typeof confirmAlert>[0], errorTitle: string) => {
    const [isLoading, setIsLoading] = useState(false);

    const run = async (action: Effect.Effect<unknown, unknown, AppServices>) => {
        const confirmed = await confirmAlert(confirmOptions);

        if (!confirmed) {
            return;
        }

        setIsLoading(true);

        await appRuntime.runPromise(
            action.pipe(
                Effect.tapCause(Effect.logError),
                Effect.catch(error => Effect.sync(() => void showErrorToast(errorTitle, getErrorMessage(error)))),
                Effect.ensuring(Effect.sync(() => void setIsLoading(false)))
            )
        );
    };

    return { isLoading, run };
};
