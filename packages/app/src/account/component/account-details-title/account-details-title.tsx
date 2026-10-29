import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly title: string;
}

const LARGE_TITLE_FONT_SIZE = 22;
const COMPACT_TITLE_FONT_SIZE = 17;
const COMPACT_TITLE_SCALE = COMPACT_TITLE_FONT_SIZE / LARGE_TITLE_FONT_SIZE;
const DEFAULT_TITLE_HEIGHT = 28;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsTitle = ({ title }: Props) => {
    const [titleHeight, setTitleHeight] = useState(DEFAULT_TITLE_HEIGHT);

    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const handleTitleLayout = (event: LayoutChangeEvent) => void setTitleHeight(event.nativeEvent.layout.height);

    const expandedTitleTop = (config.headerHeight - titleHeight) / 2;
    const collapsedTitleTop = ((config.collapsedHeaderHeight ?? config.headerHeight) - titleHeight) / 2;
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
                <Animated.View
                    className="absolute inset-x-0 top-0 min-h-[28px] items-center justify-center"
                    style={titleAnimatedStyle}
                    onLayout={handleTitleLayout}
                >
                    <Text className="text-primary font-semibold text-2xl text-center" numberOfLines={1} accessibilityRole="header">
                        {title}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};
