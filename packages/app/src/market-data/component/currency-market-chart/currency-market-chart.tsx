import { useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { MARKET_CHART_PLOT_HEIGHT } from '../../constant/market-chart-plot-height.constant';
import { MarketChartToneEnum } from '../../enum/market-chart-tone.enum';
import { useMarketChartAccessibility } from '../../hook/use-market-chart-accessibility.hook';
import { useMarketChartScrub } from '../../hook/use-market-chart-scrub.hook';
import { buildMarketChartGeometry } from '../../utils/build-market-chart-geometry.util';
import { getMarketChartTone } from '../../utils/get-market-chart-tone.util';
import { CurrencyMarketChartCursor } from '../currency-market-chart-cursor/currency-market-chart-cursor';
import { CurrencyMarketChartExtremes } from '../currency-market-chart-extremes/currency-market-chart-extremes';
import { CurrencyMarketChartScrubClip } from '../currency-market-chart-scrub-clip/currency-market-chart-scrub-clip';
import { CurrencyMarketChartSeries } from '../currency-market-chart-series/currency-market-chart-series';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly prices: readonly Pick<InstrumentDailyMarketPriceEntityInterface, 'price' | 'priceDate'>[];
    readonly selectedIndex: number | null;
    readonly rangeLabel: string;
    readonly startLabel: string;
    readonly endLabel: string;
    readonly testID: string;
    readonly onScrub: (index: number | null) => void;
}

const SCREEN_PADDING_X = 32;
const FILL_ID = 'currency-market-chart-fill';
const PAST_CLIP_ID = 'currency-market-chart-past';
const FUTURE_CLIP_ID = 'currency-market-chart-future';
const FILL_URL = `url(#${FILL_ID})`;
const PAST_CLIP_URL = `url(#${PAST_CLIP_ID})`;
const FUTURE_CLIP_URL = `url(#${FUTURE_CLIP_ID})`;
const FILL_TOP_OPACITY = 0.18;
const FUTURE_OPACITY = 0.35;
const BASELINE_DASH = '2 4';
const LINE_WIDTH = 2;
const FLAT_LINE_WIDTH = 1.5;
const TONE_STYLES = {
    [MarketChartToneEnum.POSITIVE]: {
        colorVariable: '--color-positive-strong',
        strokeClassName: 'accent-positive-strong',
        dotClassName: 'bg-positive-strong'
    },
    [MarketChartToneEnum.NEGATIVE]: {
        colorVariable: '--color-destructive-strong',
        strokeClassName: 'accent-destructive-strong',
        dotClassName: 'bg-destructive-strong'
    },
    [MarketChartToneEnum.NEUTRAL]: {
        colorVariable: '--color-secondary-foreground',
        strokeClassName: 'accent-secondary-foreground',
        dotClassName: 'bg-primary'
    }
} as const;

export const CurrencyMarketChart = ({ prices, selectedIndex, rangeLabel, startLabel, endLabel, testID, onScrub }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const values = prices.map(price => price.price);
    const [width, setWidth] = useState(windowWidth - SCREEN_PADDING_X);
    const accessibilityProps = useMarketChartAccessibility(prices, rangeLabel, selectedIndex, onScrub);
    const { activeIndex, panGesture } = useMarketChartScrub(width, values.length, onScrub);
    const geometry = buildMarketChartGeometry(values, width);
    const tone = TONE_STYLES[geometry.isFlat ? MarketChartToneEnum.NEUTRAL : getMarketChartTone(values)];
    const lineColor = useCSSVariable(tone.colorVariable);

    const series = {
        linePath: geometry.linePath,
        areaPath: geometry.areaPath,
        fill: isString(lineColor) ? FILL_URL : null,
        strokeClassName: tone.strokeClassName,
        strokeWidth: geometry.isFlat ? FLAT_LINE_WIDTH : LINE_WIDTH
    };

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);

    return (
        <View {...accessibilityProps} className="h-[184px] w-full" testID={testID}>
            <GestureDetector gesture={panGesture}>
                <View className="h-[164px] w-full" onLayout={handleLayout}>
                    <Svg width={width} height={MARKET_CHART_PLOT_HEIGHT}>
                        <Defs>
                            {isString(lineColor) ? (
                                <LinearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={lineColor} stopOpacity={FILL_TOP_OPACITY} />
                                    <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                                </LinearGradient>
                            ) : null}
                            <CurrencyMarketChartScrubClip
                                pastClipID={PAST_CLIP_ID}
                                futureClipID={FUTURE_CLIP_ID}
                                activeIndex={activeIndex}
                                xs={geometry.xs}
                                width={width}
                            />
                        </Defs>
                        <StyledLine
                            x1={0}
                            y1={geometry.baselineY}
                            x2={width}
                            y2={geometry.baselineY}
                            strokeClassName="accent-secondary-foreground"
                            strokeWidth={1}
                            strokeDasharray={BASELINE_DASH}
                        />
                        <CurrencyMarketChartSeries {...series} clipPath={PAST_CLIP_URL} opacity={1} />
                        <CurrencyMarketChartSeries {...series} clipPath={FUTURE_CLIP_URL} opacity={FUTURE_OPACITY} />
                    </Svg>

                    <CurrencyMarketChartExtremes
                        values={values}
                        xs={geometry.xs}
                        ys={geometry.ys}
                        chartWidth={width}
                        activeIndex={activeIndex}
                    />

                    <CurrencyMarketChartCursor
                        activeIndex={activeIndex}
                        xs={geometry.xs}
                        ys={geometry.ys}
                        dotClassName={tone.dotClassName}
                    />
                </View>
            </GestureDetector>

            <View className="mt-xs h-[16px] flex-row items-center justify-between">
                <Text className="text-secondary-foreground text-[12px] leading-[16px] tabular-nums" numberOfLines={1}>
                    {startLabel}
                </Text>
                <Text className="text-secondary-foreground text-[12px] leading-[16px] tabular-nums" numberOfLines={1}>
                    {endLabel}
                </Text>
            </View>
        </View>
    );
};
