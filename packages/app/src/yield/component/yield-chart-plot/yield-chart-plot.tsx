import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartPlotBody } from '../yield-chart-plot-body/yield-chart-plot-body';
import { YieldChartPlotSkeleton } from '../yield-chart-plot-skeleton/yield-chart-plot-skeleton';
import { YieldChartScrubArea } from '../yield-chart-scrub-area/yield-chart-scrub-area';
import { YieldChartSummary } from '../yield-chart-summary/yield-chart-summary';

import type { LayoutChangeEvent } from 'react-native';

const CARD_INSET = 64;
const MIN_DATA_BUCKETS = 3;

export const YieldChartPlot = () => {
    const { width: windowWidth } = useWindowDimensions();
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const summary = useYieldSummary();
    const [width, setWidth] = useState(windowWidth - CARD_INSET - YIELD_AXIS_GUTTER);

    const dataBucketCount = summary?.buckets.filter(bucket => bucket.total > 0).length ?? 0;
    const isFailure = AsyncResult.isFailure(result);

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width - YIELD_AXIS_GUTTER);

    if (isDefined(summary) && dataBucketCount < MIN_DATA_BUCKETS) {
        return <YieldChartSummary summary={summary} />;
    }

    if (!isDefined(summary)) {
        return <YieldChartPlotSkeleton />;
    }

    const body = <YieldChartPlotBody width={width} summary={summary} />;
    const plot = isFailure ? (
        <View testID={PassiveIncomeSelector.Plot}>{body}</View>
    ) : (
        <YieldChartScrubArea width={width} summary={summary}>
            {body}
        </YieldChartScrubArea>
    );

    return (
        <View className={cn('w-full', isFailure && 'opacity-50')} onLayout={handleLayout}>
            {plot}
        </View>
    );
};
