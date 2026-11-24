import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';

import type { AppServices } from '../runtime/app.runtime';

export const runBackgroundTask = <E>(
    loadProgram: () => Effect.Effect<BackgroundTask.BackgroundTaskResult, E, AppServices>
): Promise<BackgroundTask.BackgroundTaskResult> =>
    import('../runtime/app.runtime').then(({ appRuntime }) =>
        appRuntime.runPromise(
            Effect.catchCause(loadProgram(), cause => Effect.as(Effect.logError(cause), BackgroundTask.BackgroundTaskResult.Failed))
        )
    );
