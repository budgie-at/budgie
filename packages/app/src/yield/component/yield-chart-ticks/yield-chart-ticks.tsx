import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { MARKET_CHART_PADDING_X } from '../../../market-data/constant/market-chart-padding-x.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly unit: YieldBucketUnitEnum;
    readonly width: number;
}

const MAX_TICKS = 4;
const MAX_ACCESSIBILITY_TICKS = 2;
const TICK_MAX_FONT_SIZE_MULTIPLIER = 1.3;
const TICK_WIDTH = 64;
const HALF_SLOT = 0.5;
const HALF = 2;
const MONTHS_PER_YEAR = 12;

export const YieldChartTicks = ({ buckets, unit, width }: Props) => {
    const { formatTick } = useYieldDateLabels();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(buckets.length, 1);
    const tickCount = Math.min(isAccessibilityText ? MAX_ACCESSIBILITY_TICKS : MAX_TICKS, buckets.length);
    const lastIndex = buckets.length - 1;
    const firstYear = buckets.at(0)?.start.slice(0, 4);
    const lastYear = buckets.at(-1)?.start.slice(0, 4);
    const isYearVisible = buckets.length > MONTHS_PER_YEAR && firstYear !== lastYear;
    const indices = [
        ...new Set(Array.from({ length: tickCount }, (_, order) => Math.round((order * lastIndex) / Math.max(tickCount - 1, 1))))
    ];
    const ticks = indices
        .map(index => ({ index, bucket: buckets.at(index) }))
        .filter(tick => isDefined(tick.bucket))
        .map(({ index, bucket }) => {
            const centred = MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT) - TICK_WIDTH / HALF;
            const minLeft = MARKET_CHART_PADDING_X;
            const maxLeft = width - MARKET_CHART_PADDING_X - TICK_WIDTH;
            const isStart = centred < minLeft;
            const isEnd = centred > maxLeft;

            return {
                key: bucket?.start ?? String(index),
                label: isDefined(bucket) ? formatTick(bucket, unit, isYearVisible) : '',
                className: cn(isStart && 'text-left', isEnd && 'text-right', !isStart && !isEnd && 'text-center'),
                style: { left: Math.min(Math.max(centred, minLeft), maxLeft) }
            };
        });

    return (
        <View className="mt-xs h-[16px] w-full">
            {ticks.map(tick => (
                <Text
                    key={tick.key}
                    numberOfLines={1}
                    maxFontSizeMultiplier={TICK_MAX_FONT_SIZE_MULTIPLIER}
                    className={cn('absolute w-[64px] text-[12px] leading-[16px] tabular-nums text-secondary-foreground', tick.className)}
                    style={tick.style}
                >
                    {tick.label}
                </Text>
            ))}
        </View>
    );
};
