import { useEffect, useRef, useState } from 'react';
import { useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { LOCKSTEP_PUSH_SPRING, PREPARE_DELAY_MS } from '../constant/motion.constant';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { LockstepStackScreenInterface } from '../interface/lockstep-stack-screen.interface';
import type { ReactNode } from 'react';

export const useLockstepStack = () => {
    const isReducedMotion = useReducedMotion();
    const [screens, setScreens] = useState<readonly LockstepStackScreenInterface[]>([]);
    const [settledIndex, setSettledIndex] = useState(0);
    const latestScreens = useRef(screens);
    const pendingPushIndex = useRef<number | null>(null);
    const position = useSharedValue(0);
    const topIndex = useSharedValue(0);

    useEffect(() => {
        latestScreens.current = screens;
    }, [screens]);

    const handlePopped = (target: number) => {
        const removed = latestScreens.current.slice(target);

        setScreens(previous => previous.slice(0, target));
        setSettledIndex(target);
        removed.forEach(screen => screen.onClose?.());
    };

    const push = (key: string, content: ReactNode, onClose?: () => void) => {
        const target = latestScreens.current.length + 1;

        latestScreens.current = [...latestScreens.current, { key, content, onClose }];
        pendingPushIndex.current = target;
        setScreens(latestScreens.current);
        topIndex.set(target);
    };

    const handleScreenLayout = (index: number) => {
        if (pendingPushIndex.current !== index) {
            return;
        }

        pendingPushIndex.current = null;

        if (isReducedMotion) {
            position.set(index);
            setSettledIndex(index);

            return;
        }

        position.set(
            withDelay(
                PREPARE_DELAY_MS,
                withSpring(index, LOCKSTEP_PUSH_SPRING, isFinished => {
                    if (isFinished) {
                        scheduleOnRN(setSettledIndex, index);
                    }
                })
            )
        );
    };

    const pop = () => {
        const target = latestScreens.current.length - 1;

        if (target < 0) {
            return;
        }

        topIndex.set(target);

        if (isReducedMotion) {
            position.set(target);
            handlePopped(target);

            return;
        }

        position.set(
            withDelay(
                PREPARE_DELAY_MS,
                withSpring(target, LOCKSTEP_PUSH_SPRING, isFinished => {
                    if (isFinished) {
                        scheduleOnRN(handlePopped, target);
                    }
                })
            )
        );
    };

    const entries = screens.map((screen, index) => ({
        ...screen,
        index: index + 1,
        isTop: index === screens.length - 1,
        isSettled: settledIndex >= index + 1
    }));

    return {
        entries,
        isRootTop: isEmptyArray(screens),
        canPop: isNotEmptyArray(screens),
        position,
        topIndex,
        push,
        pop,
        handlePopped,
        handleScreenLayout
    };
};
