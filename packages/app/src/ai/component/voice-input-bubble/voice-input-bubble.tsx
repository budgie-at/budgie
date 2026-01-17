import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly isVisible: boolean;
    readonly committedText: string;
    readonly partialText: string;
}

const SPRING_CONFIG = { damping: 25, stiffness: 200 };
const FADE_DURATION = 150;
const BUBBLE_MARGIN_BOTTOM = 24;
const EXIT_SCALE = 0.95;
const INITIAL_TRANSLATE_Y = 8;
const MIN_BUBBLE_WIDTH = 200;
const MAX_BUBBLE_WIDTH = 300;

export const VoiceInputBubble = ({ isVisible, committedText, partialText }: Props) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(INITIAL_TRANSLATE_Y);

    const hasText = isNotEmptyString(committedText) || isNotEmptyString(partialText);

    useEffect(() => {
        if (isVisible) {
            scale.set(withSpring(1, SPRING_CONFIG));
            opacity.set(withTiming(1, { duration: FADE_DURATION, easing: Easing.out(Easing.ease) }));
            translateY.set(withSpring(0, SPRING_CONFIG));
        } else {
            scale.set(withSpring(EXIT_SCALE, { damping: 20, stiffness: 300 }));
            opacity.set(withTiming(0, { duration: FADE_DURATION, easing: Easing.in(Easing.ease) }));
            translateY.set(withSpring(INITIAL_TRANSLATE_Y, { damping: 20, stiffness: 300 }));
        }
    }, [isVisible, opacity, scale, translateY]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
        marginBottom: BUBBLE_MARGIN_BOTTOM
    }));

    if (!isVisible && opacity.value === 0) {
        return null;
    }

    const bubbleStyle = [containerAnimatedStyle, { minWidth: MIN_BUBBLE_WIDTH, maxWidth: MAX_BUBBLE_WIDTH }];

    return (
        <Animated.View className="bg-primary-reverse border border-secondary-corner rounded-3xl shadow-lg px-5 py-4" style={bubbleStyle}>
            {hasText ? (
                <View>
                    <Text className="text-primary text-base leading-6 text-center">
                        {committedText}
                        {isNotEmptyString(partialText) && <Text className="text-secondary-foreground italic"> {partialText}</Text>}
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
