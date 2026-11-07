import { parseISO } from 'date-fns/parseISO';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { EASE_OUT, MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly activeIndex: SharedValue<number>;
    readonly xs: readonly number[];
    readonly chartWidth: number;
    readonly priceDate: string | null;
}

const EDGE_CLEARANCE = 8;
const INITIAL_WIDTH = 64;
const HALF = 0.5;

export const CurrencyMarketChartDateChip = ({ activeIndex, xs, chartWidth, priceDate }: Props) => {
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const chipWidth = useSharedValue(INITIAL_WIDTH);
    const chipOpacity = useSharedValue(0);
    const lastIndex = useSharedValue(0);

    useAnimatedReaction(
        () => activeIndex.get() >= 0,
        (isActive, wasActive) => {
            if (isActive !== wasActive) {
                chipOpacity.set(withTiming(isActive ? 1 : 0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }));
            }
        }
    );

    useAnimatedReaction(
        () => activeIndex.get(),
        index => {
            if (index >= 0) {
                lastIndex.set(index);
            }
        }
    );

    const style = useAnimatedStyle(() => {
        const index = lastIndex.get();
        const width = chipWidth.get();
        const centred = (xs[index] ?? 0) - width * HALF;
        const maxLeft = Math.max(chartWidth - width - EDGE_CLEARANCE, EDGE_CLEARANCE);

        return { opacity: chipOpacity.get(), transform: [{ translateX: Math.min(Math.max(centred, EDGE_CLEARANCE), maxLeft) }] };
    });

    const label = isNotEmptyString(priceDate) ? formatMonthAndDayAndOptionalYear(parseISO(priceDate)) : '';

    const handleLayout = (event: LayoutChangeEvent) => void chipWidth.set(event.nativeEvent.layout.width);

    return (
        <Animated.Text
            pointerEvents="none"
            numberOfLines={1}
            className="absolute top-[2px] left-0 text-[12px] leading-[16px] font-medium text-secondary-foreground tabular-nums"
            style={style}
            onLayout={handleLayout}
        >
            {label}
        </Animated.Text>
    );
};
