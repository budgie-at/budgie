import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { MARKET_CHART_PADDING_X } from '../../../market-data/constant/market-chart-padding-x.constant';
import { YIELD_CHART_TICKS_HEIGHT } from '../../constant/yield-chart-ticks-height.constant';
import { YIELD_PLOT_BOTTOM_GAP } from '../../constant/yield-label-band.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { buildYieldTickIndices } from '../../utils/build-yield-tick-indices.util';
import { YieldChartTick } from '../yield-chart-tick/yield-chart-tick';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly unit: YieldBucketUnitEnum;
    readonly width: number;
}

const TICKS_STYLE = { marginTop: YIELD_PLOT_BOTTOM_GAP, height: YIELD_CHART_TICKS_HEIGHT };
const MAX_TICKS = 4;
const MAX_ACCESSIBILITY_TICKS = 2;
const HALF_SLOT = 0.5;

export const YieldChartTicks = ({ buckets, unit, width }: Props) => {
    const { formatTick } = useYieldDateLabels();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(buckets.length, 1);
    const maxTicks = isAccessibilityText ? MAX_ACCESSIBILITY_TICKS : MAX_TICKS;
    const firstYear = buckets.at(0)?.start.slice(0, 4);
    const lastYear = buckets.at(-1)?.start.slice(0, 4);
    const isYearVisible = firstYear !== lastYear;
    const { indices } = buildYieldTickIndices(buckets, unit, slot, maxTicks);
    const ticks = indices.flatMap(index => {
        const bucket = buckets.at(index);

        return isDefined(bucket)
            ? [
                  {
                      key: bucket.start,
                      label: formatTick(bucket, unit, isYearVisible),
                      centre: MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT)
                  }
              ]
            : [];
    });

    return (
        <View className="w-full" style={TICKS_STYLE}>
            {ticks.map(tick => (
                <YieldChartTick key={tick.key} label={tick.label} centre={tick.centre} plotWidth={width} />
            ))}
        </View>
    );
};
