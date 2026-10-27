import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import { AccessibilityInfo } from 'react-native';

import { appRuntime } from '../runtime/app.runtime';

export const reducedMotionAtom = Atom.make<boolean | null>(context => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', isReducedMotion => {
        context.setSelf(isReducedMotion);
    });
    const fiber = appRuntime.runFork(
        Effect.promise(() => AccessibilityInfo.isReduceMotionEnabled()).pipe(
            Effect.tap(isReducedMotion => Effect.sync(() => void context.setSelf(isReducedMotion)))
        )
    );

    context.addFinalizer(() => {
        subscription.remove();
        void appRuntime.runFork(Fiber.interrupt(fiber));
    });

    return null;
}).pipe(Atom.keepAlive);
