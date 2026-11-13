import { use } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { MarketChartScrubModeEnum } from '../../../market-data/enum/market-chart-scrub-mode.enum';
import { useMarketChartScrub } from '../../../market-data/hook/use-market-chart-scrub.hook';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldPlotAccessibility } from '../../hook/use-yield-plot-accessibility.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldSummaryInterface } from '@budgie/market';
import type { ReactNode } from 'react';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
    readonly children: ReactNode;
}

export const YieldChartScrubArea = ({ width, summary, children }: Props) => {
    const { selectedIndex, selectIndex } = use(YieldScreenContext);
    const { panGesture } = useMarketChartScrub(width, summary.buckets.length, selectIndex, MarketChartScrubModeEnum.BIN);
    const accessibilityProps = useYieldPlotAccessibility(summary, selectedIndex, selectIndex);

    return (
        <View {...accessibilityProps} testID={PassiveIncomeSelector.Plot} className="w-full">
            <GestureDetector gesture={panGesture}>
                <View collapsable={false}>{children}</View>
            </GestureDetector>
        </View>
    );
};
