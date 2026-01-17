import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

const BACKDROP_OPACITY = 0.85;
const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 100;

interface Props {
    readonly isVisible: boolean;
    readonly onClose?: () => void;
}

export const AnimatedBackdrop = ({ isVisible, onClose }: Props) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const isVisibleShared = useSharedValue(isVisible);
    const opacity = useSharedValue(isVisible ? BACKDROP_OPACITY : 0);

    const handleAnimationComplete = () => {
        setIsAnimatingOut(false);
    };

    const handleAnimationStart = () => {
        setIsAnimatingOut(true);
    };

    useDerivedValue(() => {
        isVisibleShared.value = isVisible;
    }, [isVisible]);

    useAnimatedReaction(
        () => isVisibleShared.value,
        (current, previous) => {
            if (current && !previous) {
                opacity.value = withTiming(BACKDROP_OPACITY, { duration: FADE_IN_DURATION });
            } else if (!current && previous) {
                runOnJS(handleAnimationStart)();
                opacity.value = withTiming(0, { duration: FADE_OUT_DURATION }, finished => {
                    if (finished) {
                        runOnJS(handleAnimationComplete)();
                    }
                });
            }
        },
        [isVisible]
    );

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    const shouldRender = isVisible || isAnimatingOut;
    const combinedStyle = [StyleSheet.absoluteFill, backdropStyle];

    if (!shouldRender) {
        return null;
    }

    return <Animated.View className="absolute inset-0 bg-black" style={combinedStyle} onTouchEnd={onClose} />;
};
