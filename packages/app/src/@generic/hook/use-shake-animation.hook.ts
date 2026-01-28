import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

const SHAKE_OFFSET = 10;
const SHAKE_DURATION = 50;

export const useShakeAnimation = () => {
    const translateX = useSharedValue(0);

    const shake = () => {
        translateX.set(
            withSequence(
                withTiming(SHAKE_OFFSET, { duration: SHAKE_DURATION }),
                withTiming(-SHAKE_OFFSET, { duration: SHAKE_DURATION }),
                withTiming(SHAKE_OFFSET, { duration: SHAKE_DURATION }),
                withTiming(-SHAKE_OFFSET, { duration: SHAKE_DURATION }),
                withTiming(0, { duration: SHAKE_DURATION })
            )
        );
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }]
    }));

    return { shake, animatedStyle };
};
