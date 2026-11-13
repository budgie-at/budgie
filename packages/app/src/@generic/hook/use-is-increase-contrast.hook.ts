import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Atom from 'effect/reactivity/Atom';
import { AccessibilityInfo, Platform } from 'react-native';

import { appRuntime } from '../runtime/app.runtime';

const IS_IOS = Platform.OS === 'ios';

const increaseContrastAtom = Atom.make<boolean>(context => {
    const handleChange = (isEnabled: boolean) => void context.setSelf(isEnabled);
    const subscription = IS_IOS
        ? AccessibilityInfo.addEventListener('darkerSystemColorsChanged', handleChange)
        : AccessibilityInfo.addEventListener('highTextContrastChanged', handleChange);
    const fiber = appRuntime.runFork(
        Effect.promise(() =>
            IS_IOS ? AccessibilityInfo.isDarkerSystemColorsEnabled() : AccessibilityInfo.isHighTextContrastEnabled()
        ).pipe(Effect.tap(isEnabled => Effect.sync(() => void context.setSelf(isEnabled))))
    );

    context.addFinalizer(() => {
        subscription.remove();
        void appRuntime.runFork(Fiber.interrupt(fiber));
    });

    return false;
}).pipe(Atom.keepAlive);

export const useIsIncreaseContrast = (): boolean => useAtomValue(increaseContrastAtom);
