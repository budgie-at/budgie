import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { SCREEN_CHROME_HERO_HANDOFF_DISTANCE } from '../../../@generic/constant/screen-chrome-hero-handoff-distance.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

const BALANCE_FADE_IN_START_PROGRESS = 0.4;
const BALANCE_FADE_IN_START = SCREEN_CHROME_HERO_HANDOFF_DISTANCE * BALANCE_FADE_IN_START_PROGRESS;

export const AccountDetailsSmallTitle = ({ title, balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { scrollY } = useCollapsibleHeaderScroll();

    const balanceAnimatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.get(), [BALANCE_FADE_IN_START, SCREEN_CHROME_HERO_HANDOFF_DISTANCE], [0, 1], Extrapolation.CLAMP)
    }));

    return (
        <View className="self-stretch items-center">
            <Text className="text-primary text-[17px] font-semibold text-center" numberOfLines={1}>
                {title}
            </Text>
            <Animated.Text
                className="absolute inset-x-0 top-full text-secondary-foreground text-[13px] text-center tabular-nums"
                numberOfLines={1}
                style={balanceAnimatedStyle}
            >
                {protectAmount(balance, instrumentSymbol)}
            </Animated.Text>
        </View>
    );
};
