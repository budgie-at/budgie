import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import * as Schedule from 'effect/Schedule';

import { appRuntime } from '../../@generic/runtime/app.runtime';

export const bankIntegrationStatusNowAtom = Atom.make(context => {
    const fiber = appRuntime.runFork(
        Clock.currentTimeMillis.pipe(
            Effect.tap(now => Effect.sync(() => void context.setSelf(now))),
            Effect.repeat(Schedule.spaced(Duration.minutes(1)))
        )
    );
    context.addFinalizer(() => void appRuntime.runFork(Fiber.interrupt(fiber)));

    return Date.now();
});
