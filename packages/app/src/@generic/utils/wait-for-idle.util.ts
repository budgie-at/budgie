import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const waitForIdle: Effect.Effect<void> = Effect.callback(resume => {
    const resumeVoid = () => {
        resume(Effect.void);
    };

    if (isDefined(globalThis.requestIdleCallback)) {
        const idleHandle = globalThis.requestIdleCallback(resumeVoid);

        return Effect.sync(() => {
            globalThis.cancelIdleCallback(idleHandle);
        });
    }

    const timeoutHandle = setTimeout(resumeVoid, 0);

    return Effect.sync(() => {
        clearTimeout(timeoutHandle);
    });
});
