import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { SCREEN_CHROME_HEADER_BAND_HEIGHT } from '../../../@generic/constant/screen-chrome-header-band-height.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../constant/account-details-nav-balance-offset.constant';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const FADE_IN_START = SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_BAND_HEIGHT;
const FADE_IN_DISTANCE = 16;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsNavBalance = ({ balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const collapsedHeaderCenter = (config.collapsedHeaderHeight ?? config.headerHeight) / 2;

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [FADE_IN_START, FADE_IN_START + FADE_IN_DISTANCE], [0, 1], Extrapolation.CLAMP),
        transform: [{ translateY: collapsedHeaderCenter + ACCOUNT_DETAILS_NAV_BALANCE_OFFSET }]
    }));

    return (
        <View className="absolute inset-x-0 top-0 pt-safe px-[72px]" style={Z_INDEX_STYLE} pointerEvents="none">
            <Animated.Text
                className="text-secondary-foreground text-[13px] leading-[16px] text-center tabular-nums"
                numberOfLines={1}
                style={animatedStyle}
            >
                {protectAmount(balance, instrumentSymbol)}
            </Animated.Text>
        </View>
    );
};
