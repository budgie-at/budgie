import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { YIELD_CHART_TICKS_HEIGHT } from '../../constant/yield-chart-ticks-height.constant';
import { YIELD_PLOT_BOTTOM_GAP } from '../../constant/yield-label-band.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { buildYieldTickIndices } from '../../utils/build-yield-tick-indices.util';
import { getYieldBarCenterX } from '../../utils/get-yield-bar-center-x.util';
import { getYieldSlotWidth } from '../../utils/get-yield-slot-width.util';
import { YieldChartFloatingLabel } from '../yield-chart-floating-label/yield-chart-floating-label';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly unit: YieldBucketUnitEnum;
    readonly width: number;
}

const TICKS_STYLE = { marginTop: YIELD_PLOT_BOTTOM_GAP, height: YIELD_CHART_TICKS_HEIGHT };
const MAX_TICKS = 4;
const MAX_ACCESSIBILITY_TICKS = 2;
const TICK_GLYPH_WIDTH = 7;
const TICK_CLASSNAME = 'text-[12px] leading-[16px] text-secondary-foreground';

export const YieldChartTicks = ({ buckets, unit, width }: Props) => {
    const { formatTick } = useYieldDateLabels();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const labelRight = width + YIELD_AXIS_GUTTER;
    const slot = getYieldSlotWidth(width, buckets.length);
    const maxTicks = isAccessibilityText ? MAX_ACCESSIBILITY_TICKS : MAX_TICKS;
    const firstYear = buckets.at(0)?.start.slice(0, 4);
    const lastYear = buckets.at(-1)?.start.slice(0, 4);
    const isYearVisible = firstYear !== lastYear;
    const indices = buildYieldTickIndices(buckets, unit, slot, maxTicks);
    const ticks = indices.flatMap(index => {
        const bucket = buckets.at(index);

        return isDefined(bucket)
            ? [
                  {
                      key: bucket.start,
                      label: formatTick(bucket, unit, isYearVisible),
                      centre: getYieldBarCenterX(index, buckets.length, width)
                  }
              ]
            : [];
    });

    return (
        <View className="w-full" style={TICKS_STYLE}>
            {ticks.map(tick => (
                <YieldChartFloatingLabel
                    key={tick.key}
                    text={tick.label}
                    centre={tick.centre}
                    plotWidth={labelRight}
                    glyphWidth={TICK_GLYPH_WIDTH}
                    className={TICK_CLASSNAME}
                />
            ))}
        </View>
    );
};
