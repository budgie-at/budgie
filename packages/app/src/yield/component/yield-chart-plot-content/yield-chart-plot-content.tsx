import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { useYieldAxisLabels } from '../../hook/use-yield-axis-labels.hook';
import { useYieldChartAxis } from '../../hook/use-yield-chart-axis.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartPlotBody } from '../yield-chart-plot-body/yield-chart-plot-body';
import { YieldChartScrubArea } from '../yield-chart-scrub-area/yield-chart-scrub-area';

import type { YieldSummaryInterface } from '@budgie/market';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly isFailure: boolean;
}

const CARD_INSET = 64;

export const YieldChartPlotContent = ({ summary, isFailure }: Props) => {
    const { width: windowWidth } = useWindowDimensions();
    const [outerWidth, setOuterWidth] = useState(windowWidth - CARD_INSET);
    const { gutter } = useYieldAxisLabels(useYieldChartAxis(summary));

    const width = outerWidth - gutter;
    const body = <YieldChartPlotBody width={width} summary={summary} />;
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
