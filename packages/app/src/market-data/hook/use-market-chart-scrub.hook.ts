import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { getMarketChartIndex } from '../utils/get-market-chart-index.util';

const ACTIVE_OFFSET = 6;
const FAIL_OFFSET = 12;
const ACTIVE_OFFSET_X: [number, number] = [-ACTIVE_OFFSET, ACTIVE_OFFSET];
const FAIL_OFFSET_Y: [number, number] = [-FAIL_OFFSET, FAIL_OFFSET];
const NO_INDEX = -1;

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
