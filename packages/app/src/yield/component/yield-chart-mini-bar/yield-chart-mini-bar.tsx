import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_MINI_CHART_HEIGHT } from '../../constant/yield-mini-chart-height.constant';

import type { YieldBucketInterface } from '@budgie/market';

interface Props {
    readonly bucket: Pick<YieldBucketInterface, 'start' | 'end' | 'total'>;
    readonly max: number;
    readonly focusDay: string | null;
}

const MIN_BAR_HEIGHT = 1;
const DIMMED_OPACITY = 0.3;

export const YieldChartMiniBar = ({ bucket, max, focusDay }: Props) => {
    const share = isPositiveNumber(max) ? bucket.total / max : 0;
    const isFocused = isDefined(focusDay) && bucket.start <= focusDay && focusDay <= bucket.end;
    const style = { height: Math.max(share * YIELD_MINI_CHART_HEIGHT, MIN_BAR_HEIGHT), opacity: isFocused ? 1 : DIMMED_OPACITY };

    return <View className="flex-1 rounded-t-[2px] bg-primary" style={style} />;
};
