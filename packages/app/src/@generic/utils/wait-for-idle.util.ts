import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

export const waitForIdle: Effect.Effect<void> = Effect.suspend(() =>
    isDefined(globalThis.requestIdleCallback)
        ? Effect.callback(resume => {
              const idleHandle = globalThis.requestIdleCallback(() => {
                  resume(Effect.void);
              });

              return Effect.sync(() => {
                  globalThis.cancelIdleCallback(idleHandle);
              });
          }).pipe(Effect.timeoutOption(Duration.millis(100)), Effect.asVoid)
        : Effect.yieldNow
);
