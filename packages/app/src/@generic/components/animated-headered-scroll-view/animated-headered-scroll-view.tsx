import { ReactNode } from 'react';
import { Text } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface Props {
    readonly children: ReactNode;
    readonly title: string;
}

const SCROLL_THRESHOLD = 100;
const TITLE_MIN_SCALE = 0.7;
const TITLE_MAX_SCALE = 1;
const TITLE_MAX_TRANSLATE_Y = -10;
const TITLE_MIN_TRANSLATE_Y = 0;

export const AnimatedHeaderedScrollView = ({ children, title }: Props) => {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: ({ contentOffset }) => {
            scrollY.value = contentOffset.y;
        }
    });

    const titleStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            scrollY.value,
            [0, SCROLL_THRESHOLD],
            [TITLE_MAX_SCALE, TITLE_MIN_SCALE],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollY.value,
            [0, SCROLL_THRESHOLD],
            [TITLE_MIN_TRANSLATE_Y, TITLE_MAX_TRANSLATE_Y],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }, { translateY }],
        };
    });

    return (
        <Animated.ScrollView showsVerticalScrollIndicator={false} onScroll={scrollHandler} scrollEventThrottle={16}>
            <Animated.View style={titleStyle}>
                <Text className="text-primary text-6xl mb-lg">{title}</Text>
            </Animated.View>

            {children}
        </Animated.ScrollView>
    );
};
