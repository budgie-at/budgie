import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

interface Props {
    readonly title: string;
}

const LARGE_TITLE_FONT_SIZE = 22;
const COMPACT_TITLE_FONT_SIZE = 17;
const COMPACT_TITLE_SCALE = COMPACT_TITLE_FONT_SIZE / LARGE_TITLE_FONT_SIZE;
const TITLE_BOX_HALF_HEIGHT = 14;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsTitle = ({ title }: Props) => {
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const expandedTitleTop = config.headerHeight / 2 - TITLE_BOX_HALF_HEIGHT;
    const collapsedTitleTop = (config.collapsedHeaderHeight ?? config.headerHeight) / 2 - TITLE_BOX_HALF_HEIGHT;
    const collapseRange = [config.collapseStart, config.collapseEnd];

    const titleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(scrollY.get(), collapseRange, [expandedTitleTop, collapsedTitleTop], Extrapolation.CLAMP) },
            { scale: interpolate(scrollY.get(), collapseRange, [1, COMPACT_TITLE_SCALE], Extrapolation.CLAMP) }
        ]
    }));

    return (
        <View className="absolute inset-x-0 top-0 pt-safe px-[72px]" style={Z_INDEX_STYLE} pointerEvents="none">
            <View>
                <Animated.View className="absolute inset-x-0 top-0 h-[28px] items-center justify-center" style={titleAnimatedStyle}>
                    <Text className="text-primary font-semibold text-2xl text-center" numberOfLines={1} accessibilityRole="header">
                        {title}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};
