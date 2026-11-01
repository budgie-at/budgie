import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly instrumentName: string;
    readonly latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'price'> | undefined;
    readonly priceBottom: SharedValue<number>;
}

const MIN_FRACTION_DIGITS = 2;
const PRICE_FADE_DISTANCE = 8;

export const CurrencyMarketSmallTitle = ({ instrumentName, latestPrice, priceBottom }: Props) => {
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatPrice = useFormatDigits(MIN_FRACTION_DIGITS, getMarketPriceFractionDigits(latestPrice?.price ?? 0));
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const navBarHeight = config.collapsedHeaderHeight ?? config.headerHeight;

    const priceStyle = useAnimatedStyle(() => {
        const hiddenOffset = SCREEN_CHROME_CONTENT_INSET_TOP + priceBottom.get() - navBarHeight;

        return {
            opacity: interpolate(scrollY.get(), [hiddenOffset, hiddenOffset + PRICE_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP)
        };
    });

    return (
        <View className="items-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text className="text-primary text-center text-[17px] leading-[20px] font-semibold" numberOfLines={1}>
                {instrumentName}
            </Text>
            {isDefined(latestPrice) ? (
                <Animated.Text
                    className="text-secondary-foreground text-center text-[12px] leading-[15px] tabular-nums"
                    numberOfLines={1}
                    style={priceStyle}
                >
                    {formatPrice(latestPrice.price, symbol)}
                </Animated.Text>
            ) : null}
        </View>
    );
};
