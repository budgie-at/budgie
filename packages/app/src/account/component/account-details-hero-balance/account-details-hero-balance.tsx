import { useLingui } from '@lingui/react/macro';
import { View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT } from '../../constant/account-details-hero-balance-height.constant';
import { ACCOUNT_DETAILS_NAV_BALANCE_FADE_START } from '../../constant/account-details-nav-balance-fade-start.constant';
import { ACCOUNT_DETAILS_NAV_BALANCE_OFFSET } from '../../constant/account-details-nav-balance-offset.constant';
import { useIsStaticAccountDetailsHeader } from '../../hook/use-is-static-account-details-header.hook';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const NAV_FONT_SIZE = 13;
const NAV_LINE_HEIGHT = 16;
const NAV_OPACITY = 0.72;
const STATIC_FADE_DISTANCE = 16;
const Z_INDEX = 4;

export const AccountDetailsHeroBalance = ({ balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();
    const { fontScale } = useWindowDimensions();
    const isStatic = useIsStaticAccountDetailsHeader();
    const heroFontSize = useSharedValue(ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT);

    const heroTop = top + SCREEN_CHROME_CONTENT_INSET_TOP;
    const collapsedHeaderHeight = config.collapsedHeaderHeight ?? config.headerHeight;
    const formattedBalance = protectAmount(balance, instrumentSymbol);

    const animatedStyle = useAnimatedStyle(() => {
        if (isStatic) {
            return {
                opacity: interpolate(
                    scrollY.get(),
                    [ACCOUNT_DETAILS_NAV_BALANCE_FADE_START - STATIC_FADE_DISTANCE, ACCOUNT_DETAILS_NAV_BALANCE_FADE_START],
                    [1, 0],
                    Extrapolation.CLAMP
                ),
                transform: [{ translateY: -scrollY.get() }, { scale: 1 }]
            };
        }

        const heroCenter = heroTop + ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT / 2;
        const navFontSize = NAV_FONT_SIZE * fontScale;
        const navCenter = top + collapsedHeaderHeight / 2 + (ACCOUNT_DETAILS_NAV_BALANCE_OFFSET + NAV_LINE_HEIGHT / 2) * fontScale;
        const fontSize = heroFontSize.get();
        const heroBottom = heroCenter + fontSize / 2;
        const dockScroll = Math.max(heroBottom - navFontSize / 2 - navCenter, 1);
        const progress = interpolate(scrollY.get(), [0, dockScroll], [0, 1], Extrapolation.CLAMP);
        const scale = interpolate(progress, [0, 1], [1, navFontSize / fontSize]);
        const center = Math.max(heroBottom - scrollY.get() - (fontSize * scale) / 2, navCenter);

        return {
            opacity: interpolate(progress, [0, 1], [1, NAV_OPACITY]),
            transform: [{ translateY: center - heroCenter }, { scale }]
        };
    });

    const handleLayout = (event: LayoutChangeEvent) => void heroFontSize.set(event.nativeEvent.layout.height);

    const containerStyle = [{ top: heroTop, height: ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT, zIndex: Z_INDEX }, animatedStyle];

    return (
        <Animated.View className="absolute inset-x-0 justify-center px-5xl" style={containerStyle} pointerEvents="none">
            <View
                accessible
                accessibilityLabel={t`Balance: ${formattedBalance}`}
                testID={AccountDetailsSelector.Balance}
                collapsable={false}
                onLayout={handleLayout}
            >
                <ProtectedMoney
                    className="font-semibold tracking-[-1px]"
                    minFontSize={24}
                    maxFontSize={ACCOUNT_DETAILS_HERO_BALANCE_HEIGHT}
                    instrumentSymbol={instrumentSymbol}
                >
                    {balance}
                </ProtectedMoney>
            </View>
        </Animated.View>
    );
};
