import { Text } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountDetailsSmallTitle = ({ title, balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const { scrollY } = useCollapsibleHeaderScroll();

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            scrollY.value,
            [SCREEN_CHROME_CONTENT_INSET_TOP, SCREEN_CHROME_CONTENT_INSET_TOP + 24],
            [0, 1],
            Extrapolation.CLAMP
        )
    }));

    return (
        <Animated.View className="items-center" style={animatedStyle}>
            <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
                {title}
            </Text>
            <Text className="text-secondary-foreground text-xs text-center" numberOfLines={1}>
                {protectAmount(balance, instrumentSymbol)}
            </Text>
        </Animated.View>
    );
};
