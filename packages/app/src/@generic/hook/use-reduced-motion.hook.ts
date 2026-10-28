import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useInitialReducedMotion } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { appRuntime } from '../runtime/app.runtime';

const reducedMotionAtom = Atom.make<boolean | null>(context => {
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

export const useReducedMotion = (): boolean => {
    const initialReducedMotion = useInitialReducedMotion();
    const reducedMotion = useAtomValue(reducedMotionAtom);

    return isDefined(reducedMotion) ? reducedMotion : initialReducedMotion;
};
