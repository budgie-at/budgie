import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartPlotBody } from '../yield-chart-plot-body/yield-chart-plot-body';
import { YieldChartScrubArea } from '../yield-chart-scrub-area/yield-chart-scrub-area';
import { YieldChartSummary } from '../yield-chart-summary/yield-chart-summary';

import type { LayoutChangeEvent } from 'react-native';

const CARD_INSET = 64;
const MIN_DATA_BUCKETS = 3;

export const YieldChartPlot = () => {
    const { width: windowWidth } = useWindowDimensions();
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const [width, setWidth] = useState(windowWidth - CARD_INSET);

    const summary = AsyncResult.getOrElse(result, () => null);
    const dataBucketCount = summary?.buckets.filter(bucket => bucket.total > 0).length ?? 0;
    const isFailure = AsyncResult.isFailure(result);

    const handleLayout = (event: LayoutChangeEvent) => void setWidth(event.nativeEvent.layout.width);

    if (isDefined(summary) && dataBucketCount < MIN_DATA_BUCKETS) {
        return <YieldChartSummary summary={summary} />;
    }

    const body = isDefined(summary) ? <YieldChartPlotBody width={width} summary={summary} /> : <View className="h-[200px]" />;
    const plot =
        isDefined(summary) && !isFailure ? (
            <YieldChartScrubArea width={width} summary={summary}>
                {body}
            </YieldChartScrubArea>
        ) : (
            <View testID={PassiveIncomeSelector.Plot}>{body}</View>
        );

    return (
        <LoadingContent isLoading={!isDefined(summary)}>
            <View className={cn('w-full', isFailure && 'opacity-50')} onLayout={handleLayout}>
                {plot}
            </View>
        </LoadingContent>
    );
};
