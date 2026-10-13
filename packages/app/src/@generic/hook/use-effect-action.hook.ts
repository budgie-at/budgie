import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../runtime/app.runtime';
import { showErrorToast } from '../utils/show-error-toast/show-error-toast';

import type { AppServices } from '../runtime/app.runtime';

export const useEffectAction = (errorTitle: string) => {
    const [isRunning, setIsRunning] = useState(false);

    const run = <Value, Failure>(effect: Effect.Effect<Value, Failure, AppServices>, onSuccess?: (value: Value) => void): void => {
        setIsRunning(true);
        appRuntime.runFork(
            effect.pipe(
                Effect.tap(value => Effect.sync(() => void onSuccess?.(value))),
                Effect.tapCause(cause =>
                    Cause.hasInterruptsOnly(cause)
                        ? Effect.void
                        : Effect.andThen(
                              Effect.logError(cause),
                              Effect.sync(() => void showErrorToast(errorTitle, getErrorMessage(Cause.squash(cause))))
                          )
                ),
                Effect.ensuring(Effect.sync(() => void setIsRunning(false)))
            )
        );
    };

    return [run, isRunning] as const;
};
