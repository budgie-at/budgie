import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

import { getErrorMessage } from '@rnw-community/shared';

import { showErrorToast } from './show-error-toast/show-error-toast';

export const toastOnFailure =
    (title: string, message?: string) =>
    <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        Effect.tapCause(effect, cause =>
            Cause.hasInterruptsOnly(cause)
                ? Effect.void
                : Effect.sync(() => void showErrorToast(title, message ?? getErrorMessage(Cause.squash(cause))))
        );
