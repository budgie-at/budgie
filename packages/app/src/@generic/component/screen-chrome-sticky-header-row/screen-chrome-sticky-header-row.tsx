import { use } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';

import type { ScreenChromeStickyHeaderInterface } from '../../interface/screen-chrome-sticky-header.interface';

interface Props {
    readonly header: ScreenChromeStickyHeaderInterface;
    readonly position: number;
    readonly horizontalInset: number;
}

export const ScreenChromeStickyHeaderRow = ({ header, position, horizontalInset }: Props) => {
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

    return <Animated.View style={style}>{header.content}</Animated.View>;
};
