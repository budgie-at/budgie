import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FAST_DURATION, SPRING_SETTLE } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';

interface Props {
    readonly isVisible: boolean;
    readonly committedText: string;
    readonly partialText: string;
}

const BUBBLE_MARGIN_BOTTOM = 24;
const HIDDEN_SCALE = 0.95;
const MIN_BUBBLE_WIDTH = 200;
const MAX_BUBBLE_WIDTH = 300;

export const VoiceInputBubble = ({ isVisible, committedText, partialText }: Props) => {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(0);
    const scale = useSharedValue(HIDDEN_SCALE);

    const hasText = isNotEmptyString(committedText) || isNotEmptyString(partialText);

    useEffect(() => {
        if (isVisible) {
            opacity.set(withTiming(1, { duration: MOTION_BASE_DURATION, easing: EASE_OUT }));
            scale.set(reducedMotion ? 1 : withSpring(1, SPRING_SETTLE));
        } else {
            opacity.set(withTiming(0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            scale.set(reducedMotion ? 1 : withTiming(HIDDEN_SCALE, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
        }
    }, [isVisible, opacity, reducedMotion, scale]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
        marginBottom: BUBBLE_MARGIN_BOTTOM,
        display: opacity.value === 0 ? 'none' : 'flex'
    }));

    const bubbleStyle = [containerAnimatedStyle, { minWidth: MIN_BUBBLE_WIDTH, maxWidth: MAX_BUBBLE_WIDTH }];

    return (
        <Animated.View className="bg-secondary-corner border border-corner rounded-2xl px-5 py-3" style={bubbleStyle}>
            {hasText ? (
                <View>
                    <Text className="text-primary text-base leading-6 text-center font-medium">
                        {committedText}
                        {isNotEmptyString(partialText) && <Text className="text-secondary-foreground"> {partialText}</Text>}
                    </Text>
                </View>
            ) : (
                <Text className="text-secondary-foreground text-base text-center">
                    <Trans>Listening...</Trans>
                </Text>
            )}
        </Animated.View>
    );
};
