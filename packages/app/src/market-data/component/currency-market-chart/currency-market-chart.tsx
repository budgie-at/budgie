import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { useCSSVariable } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { MARKET_CHART_HEIGHT } from '../../constant/market-chart-height.constant';
import { MarketChartToneEnum } from '../../enum/market-chart-tone.enum';
import { useMarketChartAccessibilityLabel } from '../../hook/use-market-chart-accessibility-label.hook';
import { buildMarketChartGeometry } from '../../utils/build-market-chart-geometry.util';
import { getMarketChartIndex } from '../../utils/get-market-chart-index.util';
import { getMarketChartTone } from '../../utils/get-market-chart-tone.util';
import { CurrencyMarketChartCursor } from '../currency-market-chart-cursor/currency-market-chart-cursor';
import { CurrencyMarketChartExtremes } from '../currency-market-chart-extremes/currency-market-chart-extremes';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly values: readonly number[];
    readonly rangeLabel: string;
    readonly lineOpacity: number;
    readonly testID: string;
    readonly onScrub: (index: number | null) => void;
}

const SCREEN_PADDING_X = 32;
const ACTIVE_OFFSET = 6;
const FAIL_OFFSET = 12;
const ACTIVE_OFFSET_X: [number, number] = [-ACTIVE_OFFSET, ACTIVE_OFFSET];
const FAIL_OFFSET_Y: [number, number] = [-FAIL_OFFSET, FAIL_OFFSET];
const NO_INDEX = -1;
const FILL_ID = 'currency-market-chart-fill';
const FILL_URL = `url(#${FILL_ID})`;
const FILL_TOP_OPACITY = 0.18;
const BASELINE_DASH = '2 4';
const TONE_STYLES = {
    [MarketChartToneEnum.POSITIVE]: {
        colorVariable: '--color-positive-foreground',
        strokeClassName: 'accent-positive-foreground',
        dotClassName: 'bg-positive-foreground'
    },
    [MarketChartToneEnum.NEGATIVE]: {
        colorVariable: '--color-destructive-foreground',
        strokeClassName: 'accent-destructive-foreground',
        dotClassName: 'bg-destructive-foreground'
    },
    [MarketChartToneEnum.NEUTRAL]: {
        colorVariable: '--color-secondary-foreground',
        strokeClassName: 'accent-secondary-foreground',
        dotClassName: 'bg-secondary-foreground'
    }
} as const;

export const CurrencyMarketChart = ({ values, rangeLabel, lineOpacity, testID, onScrub }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const [width, setWidth] = useState(windowWidth - SCREEN_PADDING_X);
    const [, , hapticSelection] = useVibration();
    const accessibilityLabel = useMarketChartAccessibilityLabel(values, rangeLabel);
    const tone = TONE_STYLES[getMarketChartTone(values)];
    const lineColor = useCSSVariable(tone.colorVariable);
    const activeIndex = useSharedValue(NO_INDEX);

    const { xs, ys, linePath, areaPath, baselineY } = buildMarketChartGeometry(values, width);
    const count = values.length;

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);

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

    return (
        <GestureDetector gesture={panGesture}>
            <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={accessibilityLabel}
                className="h-[184px] w-full"
                testID={testID}
                onLayout={handleLayout}
            >
                <Svg width={width} height={MARKET_CHART_HEIGHT}>
                    {isString(lineColor) ? (
                        <>
                            <Defs>
                                <LinearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={lineColor} stopOpacity={FILL_TOP_OPACITY} />
                                    <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                                </LinearGradient>
                            </Defs>
                            <Path d={areaPath} fill={FILL_URL} opacity={lineOpacity} />
                        </>
                    ) : null}
                    <StyledLine
                        x1={0}
                        y1={baselineY}
                        x2={width}
                        y2={baselineY}
                        strokeClassName="accent-secondary-foreground"
                        strokeWidth={1}
                        strokeDasharray={BASELINE_DASH}
                    />
                    <StyledPath
                        d={linePath}
                        fill="none"
                        strokeClassName={tone.strokeClassName}
                        strokeWidth={2}
                        opacity={lineOpacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>

                <CurrencyMarketChartExtremes values={values} xs={xs} ys={ys} chartWidth={width} activeIndex={activeIndex} />

                <CurrencyMarketChartCursor activeIndex={activeIndex} xs={xs} ys={ys} dotClassName={tone.dotClassName} />
            </View>
        </GestureDetector>
    );
};
