import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../../@generic/constant/screen-chrome-header-band-height.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const LARGE_TITLE_FONT_SIZE = 22;
const COMPACT_TITLE_FONT_SIZE = 17;
const COMPACT_TITLE_SCALE = COMPACT_TITLE_FONT_SIZE / LARGE_TITLE_FONT_SIZE;
const BALANCE_OFFSET_BELOW_TITLE_CENTER = 11;
const BALANCE_FADE_IN_START = SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_BAND_HEIGHT;
const BALANCE_FADE_IN_DISTANCE = 16;
const TITLE_Z_INDEX = 4;
const TITLE_BOX_HALF_HEIGHT = 14;

export const AccountDetailsTitle = ({ title, balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const expandedTitleTop = config.headerHeight / 2 - TITLE_BOX_HALF_HEIGHT;
    const collapsedHeaderCenter = (config.collapsedHeaderHeight ?? config.headerHeight) / 2;
    const collapsedTitleTop = collapsedHeaderCenter - TITLE_BOX_HALF_HEIGHT;
    const collapseRange = [config.collapseStart, config.collapseEnd];
    const containerStyle = { zIndex: TITLE_Z_INDEX };

    const titleAnimatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(scrollY.get(), collapseRange, [expandedTitleTop, collapsedTitleTop], Extrapolation.CLAMP) },
            { scale: interpolate(scrollY.get(), collapseRange, [1, COMPACT_TITLE_SCALE], Extrapolation.CLAMP) }
        ]
    }));
    const balanceAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.get(),
            [BALANCE_FADE_IN_START, BALANCE_FADE_IN_START + BALANCE_FADE_IN_DISTANCE],
            [0, 1],
            Extrapolation.CLAMP
        ),
        transform: [{ translateY: collapsedHeaderCenter + BALANCE_OFFSET_BELOW_TITLE_CENTER }]
    }));

    return (
        <View className="absolute inset-x-0 top-0 pt-safe px-[72px]" style={containerStyle} pointerEvents="none">
            <View>
                <Animated.View className="absolute inset-x-0 top-0 h-[28px] items-center justify-center" style={titleAnimatedStyle}>
                    <Text className="text-primary font-semibold text-2xl text-center" numberOfLines={1} accessibilityRole="header">
                        {title}
                    </Text>
                </Animated.View>

                <Animated.Text
                    className="absolute inset-x-0 top-0 text-secondary-foreground text-[13px] text-center tabular-nums"
                    numberOfLines={1}
                    style={balanceAnimatedStyle}
                >
                    {protectAmount(balance, instrumentSymbol)}
                </Animated.Text>
            </View>
        </View>
    );
};
