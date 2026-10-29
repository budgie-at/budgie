import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title'>;
}

export const AccountDetailsLargeTitle = ({ account }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(scrollY.value, [0, 24], [1, 0], Extrapolation.CLAMP)
    }));

    return (
        <Animated.Text className="max-w-full text-primary font-semibold text-2xl text-center" numberOfLines={1} style={animatedStyle}>
            {account.title}
        </Animated.Text>
    );
};
