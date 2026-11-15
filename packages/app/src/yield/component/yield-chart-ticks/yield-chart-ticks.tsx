import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { MARKET_CHART_PADDING_X } from '../../../market-data/constant/market-chart-padding-x.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly buckets: readonly YieldBucketInterface[];
    readonly unit: YieldBucketUnitEnum;
    readonly width: number;
}

const MAX_TICKS = 4;
const TICK_WIDTH = 64;
const HALF_SLOT = 0.5;
const HALF = 2;

export const YieldChartTicks = ({ buckets, unit, width }: Props) => {
    const { formatTick } = useYieldDateLabels();

    const slot = Math.max(width - MARKET_CHART_PADDING_X * 2, 1) / Math.max(buckets.length, 1);
    const ticks = [...new Set(Array.from({ length: MAX_TICKS }, (_, step) => Math.round((step * (buckets.length - 1)) / (MAX_TICKS - 1))))]
        .map(index => ({ index, bucket: buckets.at(index) }))
        .filter(tick => isDefined(tick.bucket))
        .map(({ index, bucket }) => ({
            key: bucket?.start ?? String(index),
            label: isDefined(bucket) ? formatTick(bucket, unit) : '',
            style: {
                left: Math.min(Math.max(MARKET_CHART_PADDING_X + slot * (index + HALF_SLOT) - TICK_WIDTH / HALF, 0), width - TICK_WIDTH)
            }
        }));

    return (
        <View className="mt-xs h-[16px] w-full">
            {ticks.map(tick => (
                <Text
                    key={tick.key}
                    numberOfLines={1}
                    maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                    className="absolute w-[64px] text-center text-[12px] leading-[16px] tabular-nums text-secondary-foreground"
                    style={tick.style}
                >
                    {tick.label}
                </Text>
            ))}
        </View>
    );
};
