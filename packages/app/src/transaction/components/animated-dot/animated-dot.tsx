import { useEffect, useMemo } from 'react';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const DOT_ANIMATION_DURATION = 600;
const DOT_SIZE = 4;
const DOT_BORDER_RADIUS = DOT_SIZE / 2;

interface Props {
    readonly delay: number;
    readonly color: string;
}

export const AnimatedDot = ({ delay, color }: Props) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.set(
            withRepeat(
                withSequence(withTiming(0, { duration: delay }), withTiming(1, { duration: DOT_ANIMATION_DURATION, easing: Easing.ease })),
                -1,
                true
            )
        );
    }, [delay, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 1, 0.3]),
        transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [0.6, 1, 0.6]) }]
    }));

    const dotStyle = useMemo(
        () => ({ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_BORDER_RADIUS, backgroundColor: color }),
        [color]
    );

    const combinedStyle = useMemo(() => [dotStyle, animatedStyle], [dotStyle, animatedStyle]);

    return <Animated.View style={combinedStyle} />;
};
