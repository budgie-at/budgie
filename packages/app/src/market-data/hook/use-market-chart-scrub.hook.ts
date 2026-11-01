import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { MARKET_CHART_PADDING_X } from '../constant/market-chart-padding-x.constant';

const ACTIVE_OFFSET = 6;
const FAIL_OFFSET = 12;
const ACTIVE_OFFSET_X: [number, number] = [-ACTIVE_OFFSET, ACTIVE_OFFSET];
const FAIL_OFFSET_Y: [number, number] = [-FAIL_OFFSET, FAIL_OFFSET];
const NO_INDEX = -1;

const getMarketChartIndex = (x: number, width: number, count: number): number => {
    'worklet';

    const drawableWidth = width - MARKET_CHART_PADDING_X * 2;
    const lastIndex = count - 1;

    if (drawableWidth <= 0 || lastIndex <= 0) {
        return 0;
    }

    const index = Math.round(((x - MARKET_CHART_PADDING_X) / drawableWidth) * lastIndex);

    return Math.min(Math.max(index, 0), lastIndex);
};

export const useMarketChartScrub = (width: number, count: number, onScrub: (index: number | null) => void) => {
    const [, , hapticSelection] = useVibration();
    const activeIndex = useSharedValue(NO_INDEX);

    useAnimatedReaction(
        () => activeIndex.get(),
        (current, previous) => {
            if (current !== previous) {
                scheduleOnRN(onScrub, current === NO_INDEX ? null : current);
            }
        }
    );

    const panGesture = Gesture.Pan()
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetY(FAIL_OFFSET_Y)
        .onStart(event => {
            scheduleOnRN(hapticSelection);
            activeIndex.set(getMarketChartIndex(event.x, width, count));
        })
        .onUpdate(event => {
            activeIndex.set(getMarketChartIndex(event.x, width, count));
        })
        .onFinalize(() => {
            activeIndex.set(NO_INDEX);
        });

    return { activeIndex, panGesture };
};
