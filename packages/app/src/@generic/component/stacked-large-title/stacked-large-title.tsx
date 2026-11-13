import { Text } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

interface Props {
    readonly title: string;
}

const LARGE_TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const SCROLL_TRACK_DISTANCE = 100;

export const StackedLargeTitle = ({ title }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();

    const trackScrollStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(scrollY.get(), [0, SCROLL_TRACK_DISTANCE], [0, -SCROLL_TRACK_DISTANCE], {
                    extrapolateLeft: Extrapolation.CLAMP,
                    extrapolateRight: Extrapolation.EXTEND
                })
            }
        ]
    }));

    return (
        <Animated.View className="-ml-[40px] flex-1 justify-end pb-xs" style={trackScrollStyle}>
            <Text
                className="text-primary text-[34px] leading-[41px] font-bold"
                accessibilityRole="header"
                adjustsFontSizeToFit
                maxFontSizeMultiplier={LARGE_TITLE_MAX_FONT_SIZE_MULTIPLIER}
                minimumFontScale={0.5}
                numberOfLines={1}
            >
                {title}
            </Text>
        </Animated.View>
    );
};
