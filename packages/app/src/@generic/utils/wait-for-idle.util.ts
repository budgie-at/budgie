import * as Effect from 'effect/Effect';

import { scheduleIdleCallback } from './schedule-idle-callback.util';

export const waitForIdle: Effect.Effect<void> = Effect.callback(resume => {
    const cancelIdleCallback = scheduleIdleCallback(() => {
        resume(Effect.void);
    });

    return Effect.sync(cancelIdleCallback);
});
