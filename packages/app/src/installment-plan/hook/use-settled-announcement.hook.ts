import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { appRuntime } from '../../@generic/runtime/app.runtime';

const ANNOUNCEMENT_DELAY_MS = 600;

export const useSettledAnnouncement = (announcement: string) => {
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const announcedRef = useRef(announcement);

    useEffect(() => {
        if (isKeyboardVisible || announcedRef.current === announcement) {
            return;
        }

        const fiber = appRuntime.runFork(
            Effect.sleep(ANNOUNCEMENT_DELAY_MS).pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        announcedRef.current = announcement;
                        AccessibilityInfo.announceForAccessibility(announcement);
                    })
                )
            )
        );

        return () => void appRuntime.runFork(Fiber.interrupt(fiber));
    }, [announcement, isKeyboardVisible]);
};
