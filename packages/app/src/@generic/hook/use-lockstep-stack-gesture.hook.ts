import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { LOCKSTEP_PUSH_SPRING } from '../constant/motion.constant';

import type { UseLockstepStackGestureParamsInterface } from '../interface/use-lockstep-stack-gesture-params.interface';

const EDGE_WIDTH = 24;
const ACTIVE_OFFSET_X = 10;
const FAIL_OFFSET_Y = 10;
const POP_DISTANCE_RATIO = 0.35;
const POP_VELOCITY = 600;

export const useLockstepStackGesture = ({ position, topIndex, width, isEnabled, onPopped }: UseLockstepStackGestureParamsInterface) => {
    const dragStart = useSharedValue(0);

    return Gesture.Pan()
        .enabled(isEnabled)
        .hitSlop({ left: 0, width: EDGE_WIDTH })
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onStart(() => {
            cancelAnimation(position);
            dragStart.set(topIndex.get());
        })
        .onUpdate(event => {
            const next = dragStart.get() - event.translationX / width;

            position.set(Math.min(Math.max(next, dragStart.get() - 1), dragStart.get()));
        })
        .onEnd(event => {
            const top = dragStart.get();
            const isPopped = event.translationX > width * POP_DISTANCE_RATIO || event.velocityX > POP_VELOCITY;
            const target = isPopped ? top - 1 : top;
            const velocity = -event.velocityX / width;

            if (isPopped) {
                topIndex.set(target);
            }

            position.set(
                withSpring(target, { ...LOCKSTEP_PUSH_SPRING, velocity }, isFinished => {
                    if (isFinished && isPopped) {
                        scheduleOnRN(onPopped, target);
                    }
                })
            );
        });
};
