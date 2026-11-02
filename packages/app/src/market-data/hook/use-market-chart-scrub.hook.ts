import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

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

    const selectIndex = (index: number) => {
        'worklet';

        if (activeIndex.get() !== index) {
            activeIndex.set(index);
            scheduleOnRN(onScrub, index === NO_INDEX ? null : index);
        }
    };

    const handleSelect = (index: number) => void scheduleOnUI(selectIndex, index);

    const panGesture = Gesture.Pan()
        .activeOffsetX(ACTIVE_OFFSET_X)
        .failOffsetY(FAIL_OFFSET_Y)
        .onStart(event => {
            scheduleOnRN(hapticSelection);
            selectIndex(getMarketChartIndex(event.x, width, count));
        })
        .onUpdate(event => {
            selectIndex(getMarketChartIndex(event.x, width, count));
        })
        .onFinalize(() => {
            selectIndex(NO_INDEX);
        });

    return { activeIndex, panGesture, handleSelect };
};
