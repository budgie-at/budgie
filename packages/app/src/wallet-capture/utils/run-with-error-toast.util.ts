import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { appRuntime } from '../../@generic/runtime/app.runtime';

export const runWithErrorToast = (effect: Effect.Effect<void>, errorTitle: string) =>
    appRuntime.runFork(
        effect.pipe(
            Effect.tapCause(Effect.logError),
            Effect.catchCause(cause =>
                Effect.sync(() => {
                    Toast.show({ type: 'error', text1: errorTitle, text2: getErrorMessage(Cause.squash(cause)) });
                })
            )
        )
    );
