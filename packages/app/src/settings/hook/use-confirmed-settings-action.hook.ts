import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { AppServices } from '../../@generic/runtime/app.runtime';

export const useConfirmedSettingsAction = (confirmOptions: Parameters<typeof confirmAlert>[0], errorTitle: string) => {
    const { isLoading, run: runSingleFlight } = useSingleFlight();

    const run = (action: Effect.Effect<unknown, unknown, AppServices>) =>
        runSingleFlight(
            Effect.gen(function* () {
                if (!(yield* confirmAlert(confirmOptions))) {
                    return;
                }

                yield* action;
            }).pipe(toastOnFailure(errorTitle))
        );

    return { isLoading, run };
};
