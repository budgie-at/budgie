import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { ACCOUNT_DETAILS_NAV_BALANCE_FADE_START } from '../../constant/account-details-nav-balance-fade-start.constant';
import { useAccountDetailsBalanceLabel } from '../../hook/use-account-details-balance-label.hook';
import { useAccountHeroValue } from '../../hook/use-account-hero-value.hook';

import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly account: Pick<AccountWithInstrumentEntityInterface, 'type' | AccountAssociationEnum.INSTRUMENT>;
}

const FADE_DISTANCE = 16;
const Z_INDEX_STYLE = { zIndex: 4 };

export const AccountDetailsStaticTitle = ({ title, ...props }: Props) => {
    const { balance, account } = useAccountHeroValue(props.account, props.balance);
    const getBalanceLabel = useAccountDetailsBalanceLabel();
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
                <Text
                    className="text-primary font-semibold text-[17px] text-center"
                    {...CHROME_TITLE_TEXT_PROPS}
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    accessibilityRole="header"
                >
                    {title}
                </Text>
                <Animated.Text
                    className="text-secondary-foreground text-[13px] leading-[16px] text-center tabular-nums"
                    numberOfLines={1}
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    style={balanceAnimatedStyle}
                >
                    {getBalanceLabel(balance, account)}
                </Animated.Text>
            </View>
        </View>
    );
};
