import { use } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { YieldChartBars } from '../yield-chart-bars/yield-chart-bars';
import { YieldChartRunningTotal } from '../yield-chart-running-total/yield-chart-running-total';
import { YieldChartTicks } from '../yield-chart-ticks/yield-chart-ticks';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const CROSS_FADE_DURATION = 150;
const CROSS_FADE = FadeIn.duration(CROSS_FADE_DURATION).easing(EASE_OUT);

export const YieldChartPlotBody = ({ width, summary }: Props) => {
    const { screenKey, mode } = use(YieldScreenContext);
    const reducedMotion = useReducedMotion();

    const { range, group } = screenKey.key;
    const plotKey = reducedMotion ? `${range}-${group}-${mode}-${summary.buckets.length}` : `${range}-${mode}-${summary.buckets.length}`;
    const plot =
        mode === YieldChartModeEnum.BARS ? (
            <YieldChartBars width={width} summary={summary} />
        ) : (
            <YieldChartRunningTotal width={width} summary={summary} />
        );

    return (
        <>
            <Animated.View key={plotKey} entering={CROSS_FADE}>
                {plot}
            </Animated.View>
            <YieldChartTicks buckets={summary.buckets} unit={summary.bucketUnit} width={width} />
        </>
    );
};
