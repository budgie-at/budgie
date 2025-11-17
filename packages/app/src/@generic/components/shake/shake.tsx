import { ReactNode, useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

interface Props {
    readonly isEnabled: boolean;
    readonly children: ReactNode;
}

const ANIMATION_DURATION = 50;
const STEP_1 = 4;
const STEP_2 = 3;
const STEP_3 = 0;

export const Shake = ({ isEnabled, children }: Props) => {
    const offsetX = useSharedValue(STEP_3);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offsetX.value }],
        flex: 1
    }));

    const style = [animatedStyle, { flex: 1 }];

    useEffect(() => {
        if (!isEnabled) {
            offsetX.set(STEP_3);

            return;
        }

        offsetX.set(STEP_3);
        offsetX.set(
            withSequence(
                withTiming(-STEP_1, { duration: ANIMATION_DURATION }),
                withTiming(STEP_1, { duration: ANIMATION_DURATION }),
                withTiming(-STEP_2, { duration: ANIMATION_DURATION }),
                withTiming(STEP_2, { duration: ANIMATION_DURATION }),
                withTiming(STEP_3, { duration: ANIMATION_DURATION })
            )
        );
    }, [isEnabled, offsetX]);

    return <Animated.View style={style}>{children}</Animated.View>;
};
