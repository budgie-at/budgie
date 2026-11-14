import { Text, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

interface Props {
    readonly title: string;
}

const LARGE_TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.2;
const SCROLL_TRACK_DISTANCE = 100;
const BACK_BUTTON_ROW_OFFSET = -40;
const READABLE_CONTENT_MAX_WIDTH = 720;

export const StackedLargeTitle = ({ title }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { config } = useScreenChrome();
    const { width } = useWindowDimensions();

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
    const titleStyle = [
        { height: config.headerHeight, marginLeft: BACK_BUTTON_ROW_OFFSET + Math.max(0, (width - READABLE_CONTENT_MAX_WIDTH) / 2) },
        trackScrollStyle
    ];

    return (
        <Animated.View className="justify-end pb-xs" style={titleStyle}>
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
