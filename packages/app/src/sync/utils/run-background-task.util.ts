import * as Effect from 'effect/Effect';
import * as BackgroundTask from 'expo-background-task';

import { appRuntime } from '../../@generic/runtime/app.runtime';

import type * as ManagedRuntime from 'effect/ManagedRuntime';

export const runBackgroundTask = <E>(
    program: Effect.Effect<BackgroundTask.BackgroundTaskResult, E, ManagedRuntime.ManagedRuntime.Services<typeof appRuntime>>
): Promise<BackgroundTask.BackgroundTaskResult> =>
    appRuntime.runPromise(
        Effect.catchCause(program, cause => Effect.as(Effect.logError(cause), BackgroundTask.BackgroundTaskResult.Failed))
    );
