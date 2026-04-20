import { Trans } from '@lingui/react/macro';
import { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { HomePageSelector } from '../../../app/(tabs)/home-page.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { ProtectedMoney } from '../protected-money/protected-money';
import { ProtectedText } from '../protected-text/protected-text';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly scrollY: SharedValue<number>;
}

const HEADER_COLLAPSED_HEIGHT = 40;
const HEADER_EXPANDED_HEIGHT = 140;
const SCROLL_THRESHOLD = 100;
const EXPANDED_OPACITY_THRESHOLD = 0.6;
const COLLAPSED_OPACITY_THRESHOLD = 0.5;
const BACKGROUND_OPACITY_THRESHOLD = 0.7;
const EXPANDED_SCALE_MIN = 0.9;
const EXPANDED_TRANSLATE_Y = -20;
const COLLAPSED_TRANSLATE_Y = 10;

// eslint-disable-next-line max-statements, max-lines-per-function -- Animated header with multiple interpolated styles
export const CollapsibleHeader = ({ scrollY }: Props) => {
    const { top } = useSafeAreaInsets();
    const { defaultInstrument, decimalPlaces } = useSettingsContext();
    const netWorth = useNetWorthQuery();
    const showCents = useSetting('showCents');
    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);
    const [expandedHeaderWidth, setExpandedHeaderWidth] = useState(0);

    const formattedNetWorth = formatDigits(netWorth, defaultInstrument.symbol);
    const formattedNetWorthValue = formatDigits(netWorth);
    const netWorthValueTestID = HomePageSelector.NetWorthValue(formattedNetWorthValue);

    const expandedHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, SCROLL_THRESHOLD * EXPANDED_OPACITY_THRESHOLD], [1, 0], Extrapolation.CLAMP);
        const translateY = interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [0, EXPANDED_TRANSLATE_Y], Extrapolation.CLAMP);
        const scale = interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [1, EXPANDED_SCALE_MIN], Extrapolation.CLAMP);

        return {
            opacity,
            transform: [{ translateY }, { scale }]
        };
    });

    const collapsedHeaderStyle = useAnimatedStyle(() => {
        const collapsedStart = SCROLL_THRESHOLD * COLLAPSED_OPACITY_THRESHOLD;

        return {
            opacity: interpolate(scrollY.value, [collapsedStart, SCROLL_THRESHOLD], [0, 1], Extrapolation.CLAMP),
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [collapsedStart, SCROLL_THRESHOLD],
                        [COLLAPSED_TRANSLATE_Y, 0],
                        Extrapolation.CLAMP
                    )
                }
            ]
        };
    });

    const headerBackgroundStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [SCROLL_THRESHOLD * BACKGROUND_OPACITY_THRESHOLD, SCROLL_THRESHOLD],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    const headerContainerStyle = useAnimatedStyle(() => ({
        height: interpolate(scrollY.value, [0, SCROLL_THRESHOLD], [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT], Extrapolation.CLAMP)
    }));

    const containerStyle = { paddingTop: top };
    const availableTickerWidth = Math.max(expandedHeaderWidth - 40, 0);

    const handleExpandedHeaderLayout = (event: LayoutChangeEvent) => {
        setExpandedHeaderWidth(event.nativeEvent.layout.width);
    };

    return (
        <View style={containerStyle}>
            <Animated.View className="absolute inset-x-0 bottom-0 top-0 bg-background" style={headerBackgroundStyle} />

            <Animated.View className="relative" style={headerContainerStyle} testID={HomePageSelector.TotalBalance}>
                <Animated.View
                    className="absolute inset-x-0 top-0 bottom-0 flex-row items-center justify-between px-5xl"
                    style={collapsedHeaderStyle}
                >
                    <Text className="text-xs uppercase text-secondary-foreground">
                        <Trans>Total Balance</Trans>
                    </Text>
                    <ProtectedText className="text-lg font-medium text-primary" testID={netWorthValueTestID}>
                        {formattedNetWorth}
                    </ProtectedText>
                </Animated.View>

                <Animated.View
                    className="absolute inset-x-0 top-0 bottom-0 px-5xl items-center justify-center"
                    style={expandedHeaderStyle}
                    onLayout={handleExpandedHeaderLayout}
                >
                    <Text className="text-xs uppercase text-secondary-foreground mb-md">
                        <Trans>Total Balance</Trans>
                    </Text>

                    <View testID={netWorthValueTestID}>
                        <ProtectedMoney
                            decimalPlaces={decimalPlaces}
                            minFontSize={24}
                            maxFontSize={60}
                            instrumentSymbol={defaultInstrument.symbol}
                            availableWidth={availableTickerWidth}
                        >
                            {netWorth}
                        </ProtectedMoney>
                    </View>
                </Animated.View>
            </Animated.View>
        </View>
    );
};
