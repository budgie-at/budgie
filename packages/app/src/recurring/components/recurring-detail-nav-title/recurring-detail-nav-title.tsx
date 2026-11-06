import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useScreenChrome, useScreenChromeScrollY } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE } from '../../../transaction/constant/transaction-info-compact-max-font-scale.constant';

interface Props {
    readonly title: string;
}

const Z_INDEX_STYLE = { zIndex: 4 };
const TITLE_REVEAL_START = 60;
const TITLE_REVEAL_END = 100;

export const RecurringDetailNavTitle = ({ title }: Props) => {
    const { config } = useScreenChrome();
    const scrollY = useScreenChromeScrollY();
    const revealStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [TITLE_REVEAL_START, TITLE_REVEAL_END], [0, 1], Extrapolation.CLAMP)
    }));
    const rowStyle = { height: config.headerHeight };

    return (
        <View
            className="absolute inset-x-0 top-0 px-[96px] pt-safe"
            style={Z_INDEX_STYLE}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View className="justify-center" style={rowStyle}>
                <Animated.Text
                    maxFontSizeMultiplier={TRANSACTION_INFO_COMPACT_MAX_FONT_SCALE}
                    className="text-center text-[17px] font-semibold leading-[21px] text-primary"
                    style={revealStyle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {title}
                </Animated.Text>
            </View>
        </View>
    );
};
