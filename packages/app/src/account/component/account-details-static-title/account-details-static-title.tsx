import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ACCOUNT_DETAILS_NAV_BALANCE_FADE_START } from '../../constant/account-details-nav-balance-fade-start.constant';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const FADE_DISTANCE = 16;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsStaticTitle = ({ title, balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const titleBandStyle = { minHeight: config.collapsedHeaderHeight ?? config.headerHeight };

    const balanceAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.get(),
            [ACCOUNT_DETAILS_NAV_BALANCE_FADE_START, ACCOUNT_DETAILS_NAV_BALANCE_FADE_START + FADE_DISTANCE],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    return (
        <View className="absolute inset-x-0 top-0 pt-safe px-[72px]" style={Z_INDEX_STYLE} pointerEvents="none">
            <View className="items-center justify-center" style={titleBandStyle}>
                <Text className="text-primary font-semibold text-[17px] text-center" numberOfLines={1} accessibilityRole="header">
                    {title}
                </Text>
                <Animated.Text
                    className="text-secondary-foreground text-[13px] text-center tabular-nums"
                    numberOfLines={1}
                    style={balanceAnimatedStyle}
                >
                    {protectAmount(balance, instrumentSymbol)}
                </Animated.Text>
            </View>
        </View>
    );
};
