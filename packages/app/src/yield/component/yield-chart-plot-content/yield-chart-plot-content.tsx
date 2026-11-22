import { use, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldAxisLabels } from '../../hook/use-yield-axis-labels.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { buildYieldSummaryAxis } from '../../utils/build-yield-summary-axis.util';
import { YieldChartBars } from '../yield-chart-bars/yield-chart-bars';
import { YieldChartRunningTotal } from '../yield-chart-running-total/yield-chart-running-total';
import { YieldChartScrubArea } from '../yield-chart-scrub-area/yield-chart-scrub-area';
import { YieldChartTicks } from '../yield-chart-ticks/yield-chart-ticks';

import type { YieldSummaryInterface } from '@budgie/market';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly isFailure: boolean;
}

const CARD_INSET = 64;
const CROSS_FADE_DURATION = 150;
const CROSS_FADE = FadeIn.duration(CROSS_FADE_DURATION).easing(EASE_OUT);

export const YieldChartPlotContent = ({ summary, isFailure }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const [outerWidth, setOuterWidth] = useState(windowWidth - CARD_INSET);
    const { screenKey, mode } = use(YieldScreenContext);
    const reducedMotion = useReducedMotion();

    const axis = buildYieldSummaryAxis(summary, screenKey.key.group, mode);
    const { gutter } = useYieldAxisLabels(axis);
    const width = outerWidth - gutter;
    const { range, group } = screenKey.key;
    const plotKey = reducedMotion ? `${range}-${group}-${mode}-${summary.buckets.length}` : `${range}-${mode}-${summary.buckets.length}`;
    const chart =
        mode === YieldChartModeEnum.BARS ? (
            <YieldChartBars width={width} summary={summary} axis={axis} />
        ) : (
            <YieldChartRunningTotal width={width} summary={summary} axis={axis} />
        );
    const body = (
        <>
            <Animated.View key={plotKey} entering={CROSS_FADE}>
                {chart}
            </Animated.View>
            <YieldChartTicks buckets={summary.buckets} unit={summary.bucketUnit} width={width} />
        </>
    );
    const plot = isFailure ? (
        <View testID={PassiveIncomeSelector.Plot}>{body}</View>
    ) : (
        <YieldChartScrubArea width={width} summary={summary}>
            {body}
        </YieldChartScrubArea>
    );

    const handleLayout = (event: LayoutChangeEvent) => void setOuterWidth(event.nativeEvent.layout.width);

    return (
        <View className={cn('w-full', isFailure && 'opacity-50')} onLayout={handleLayout}>
            {plot}
        </View>
    );
};
