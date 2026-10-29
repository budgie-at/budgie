import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ACCOUNT_DETAILS_NAV_BALANCE_FADE_START } from '../../constant/account-details-nav-balance-fade-start.constant';
import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../constant/account-details-nav-balance-offset.constant';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const FADE_IN_DISTANCE = 16;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsNavBalance = ({ balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const { fontScale } = useWindowDimensions();

    const navBalanceTop = (config.collapsedHeaderHeight ?? config.headerHeight) / 2 + ACCOUNT_DETAILS_NAV_BALANCE_OFFSET * fontScale;

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.get(),
            [ACCOUNT_DETAILS_NAV_BALANCE_FADE_START, ACCOUNT_DETAILS_NAV_BALANCE_FADE_START + FADE_IN_DISTANCE],
            [0, 1],
            Extrapolation.CLAMP
        ),
        transform: [{ translateY: navBalanceTop }]
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
