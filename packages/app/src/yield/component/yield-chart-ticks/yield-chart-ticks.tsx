import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { MARKET_CHART_PADDING_X } from '../../../market-data/constant/market-chart-padding-x.constant';
import { YIELD_CHART_TICKS_HEIGHT } from '../../constant/yield-chart-ticks-height.constant';
import { YIELD_PLOT_BOTTOM_GAP } from '../../constant/yield-label-band.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { buildYieldTickIndices } from '../../utils/build-yield-tick-indices.util';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly unit: YieldBucketUnitEnum;
    readonly width: number;
    readonly gutter: number;
}

const TICKS_STYLE = { marginTop: YIELD_PLOT_BOTTOM_GAP, height: YIELD_CHART_TICKS_HEIGHT };
const MAX_TICKS = 4;
const MAX_ACCESSIBILITY_TICKS = 2;
const TICK_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const TICK_WIDTH = 64;
const HALF_SLOT = 0.5;
const HALF = 2;
const MONTHS_PER_YEAR = 12;

export const YieldChartTicks = ({ buckets, unit, width, gutter }: Props) => {
    const { formatTick } = useYieldDateLabels();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(buckets.length, 1);
    const maxTicks = isAccessibilityText ? MAX_ACCESSIBILITY_TICKS : MAX_TICKS;
    const firstYear = buckets.at(0)?.start.slice(0, 4);
    const lastYear = buckets.at(-1)?.start.slice(0, 4);
    const isYearVisible = buckets.length >= MONTHS_PER_YEAR && firstYear !== lastYear;
    const { indices, isSparse } = buildYieldTickIndices(buckets, unit, slot, maxTicks);
    const ticks = indices
        .map(index => ({ index, bucket: buckets.at(index) }))
        .filter(tick => isDefined(tick.bucket))
        .map(({ index, bucket }) => {
            const centred = MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT) - TICK_WIDTH / HALF;
            const maxLeft = width + gutter - TICK_WIDTH;
            const isStart = centred < 0;
            const isEnd = centred > maxLeft;

            return {
                key: bucket?.start ?? String(index),
                label: isDefined(bucket) ? formatTick(bucket, unit, !isSparse && isYearVisible) : '',
                className: cn(
                    'absolute w-[64px] text-[12px] leading-[16px] tabular-nums text-secondary-foreground',
                    isStart && 'text-left',
                    isEnd && 'text-right',
                    !isStart && !isEnd && 'text-center'
                ),
                style: { left: Math.min(Math.max(centred, 0), maxLeft) }
            };
        });

    return (
        <View className="w-full" style={TICKS_STYLE}>
            {ticks.map(tick => (
                <Text
                    key={tick.key}
                    numberOfLines={1}
                    maxFontSizeMultiplier={TICK_MAX_FONT_SIZE_MULTIPLIER}
                    className={tick.className}
                    style={tick.style}
                >
                    {tick.label}
                </Text>
            ))}
        </View>
    );
};
