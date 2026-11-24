import { use } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';

import type { ReactNode } from 'react';

interface Props {
    readonly position: number;
    readonly horizontalInset: number;
    readonly children: ReactNode;
}

export const ScreenChromeStickyHeaderRow = ({ position, horizontalInset, children }: Props) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const state = context?.state;
    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        left: horizontalInset,
        right: horizontalInset,
        top: 0,
        opacity: state?.get().index === position ? 1 : 0,
        transform: [{ translateY: state?.get().translateY ?? 0 }]
    }));

    return <Animated.View style={style}>{children}</Animated.View>;
};
