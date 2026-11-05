import { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface Props {
    readonly height: number;
}

const BLINK_STEP_MS = 500;
const MIN_OPACITY = 0.25;

export const AmountCaret = ({ height }: Props) => {
    const isReducedMotion = useReducedMotion();
    const opacity = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get(), height }));

    useEffect(() => {
        if (!isReducedMotion) {
            opacity.set(
                withRepeat(
                    withSequence(withTiming(MIN_OPACITY, { duration: BLINK_STEP_MS }), withTiming(1, { duration: BLINK_STEP_MS })),
                    -1
                )
            );
        }
    }, [isReducedMotion, opacity]);

    return <Animated.View pointerEvents="none" className="w-[2px] rounded-full bg-primary" style={animatedStyle} />;
};
