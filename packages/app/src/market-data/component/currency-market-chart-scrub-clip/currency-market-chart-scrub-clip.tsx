import { useAnimatedProps } from 'react-native-reanimated';
import { ClipPath } from 'react-native-svg';

import { AnimatedSvgRect } from '../../../@generic/component/animated-svg-rect/animated-svg-rect';
import { MARKET_CHART_PLOT_HEIGHT } from '../../constant/market-chart-plot-height.constant';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly pastClipID: string;
    readonly futureClipID: string;
    readonly activeIndex: SharedValue<number>;
    readonly xs: readonly number[];
    readonly width: number;
}

export const CurrencyMarketChartScrubClip = ({ pastClipID, futureClipID, activeIndex, xs, width }: Props) => {
    const pastProps = useAnimatedProps(() => {
        const index = activeIndex.get();

        return { width: index < 0 ? width : (xs[index] ?? width) };
    });
    const futureProps = useAnimatedProps(() => {
        const index = activeIndex.get();
        const cursorX = index < 0 ? width : (xs[index] ?? width);

        return { x: cursorX, width: Math.max(width - cursorX, 0) };
    });

    return (
        <>
            <ClipPath id={pastClipID}>
                <AnimatedSvgRect x={0} y={0} height={MARKET_CHART_PLOT_HEIGHT} animatedProps={pastProps} />
            </ClipPath>
            <ClipPath id={futureClipID}>
                <AnimatedSvgRect y={0} height={MARKET_CHART_PLOT_HEIGHT} animatedProps={futureProps} />
            </ClipPath>
        </>
    );
};
