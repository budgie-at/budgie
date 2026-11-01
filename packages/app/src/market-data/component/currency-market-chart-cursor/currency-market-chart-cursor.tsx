import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly activeIndex: SharedValue<number>;
    readonly xs: readonly number[];
    readonly ys: readonly number[];
    readonly isPositive: boolean;
}

const DOT_RADIUS = 6;
const LINE_HALF_WIDTH = 0.5;

export const CurrencyMarketChartCursor = ({ activeIndex, xs, ys, isPositive }: Props) => {
    const lineStyle = useAnimatedStyle(() => {
        const index = activeIndex.get();

        return { opacity: index < 0 ? 0 : 1, transform: [{ translateX: (xs[index] ?? 0) - LINE_HALF_WIDTH }] };
    });
    const dotStyle = useAnimatedStyle(() => {
        const index = activeIndex.get();

        return {
            opacity: index < 0 ? 0 : 1,
            transform: [{ translateX: (xs[index] ?? 0) - DOT_RADIUS }, { translateY: (ys[index] ?? 0) - DOT_RADIUS }]
        };
    });
    const dotClassName = isPositive
        ? 'absolute top-0 left-0 size-[12px] rounded-full border-2 border-surface bg-positive-foreground'
        : 'absolute top-0 left-0 size-[12px] rounded-full border-2 border-surface bg-destructive-foreground';

    return (
        <>
            <Animated.View pointerEvents="none" className="absolute top-0 bottom-0 left-0 w-px bg-secondary-foreground" style={lineStyle} />
            <Animated.View pointerEvents="none" className={dotClassName} style={dotStyle} />
        </>
    );
};
