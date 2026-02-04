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

const ENTER_DURATION = 150;
const EXIT_DURATION = 100;
const BUBBLE_MARGIN_BOTTOM = 24;
const ENTER_SCALE = 0.96;
const SPRING_CONFIG = { damping: 12, stiffness: 180 };
const MIN_BUBBLE_WIDTH = 200;
const MAX_BUBBLE_WIDTH = 300;

export const VoiceInputBubble = ({ isVisible, committedText, partialText }: Props) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(ENTER_SCALE);

    const hasText = isNotEmptyString(committedText) || isNotEmptyString(partialText);

    useEffect(() => {
        if (isVisible) {
            opacity.set(withTiming(1, { duration: ENTER_DURATION, easing: Easing.out(Easing.ease) }));
            scale.set(withSpring(1, SPRING_CONFIG));
        } else {
            opacity.set(withTiming(0, { duration: EXIT_DURATION, easing: Easing.in(Easing.ease) }));
            scale.set(withTiming(ENTER_SCALE, { duration: EXIT_DURATION, easing: Easing.in(Easing.ease) }));
        }
    }, [isVisible, opacity, scale]);

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
