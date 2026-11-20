import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldChartPlotContent } from '../yield-chart-plot-content/yield-chart-plot-content';
import { YieldChartPlotSkeleton } from '../yield-chart-plot-skeleton/yield-chart-plot-skeleton';
import { YieldChartSummary } from '../yield-chart-summary/yield-chart-summary';

const MIN_DATA_BUCKETS = 3;

export const YieldChartPlot = () => {
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const summary = useYieldSummary();

    if (!isDefined(summary)) {
        return <YieldChartPlotSkeleton />;
    }

    if (summary.buckets.filter(bucket => bucket.total > 0).length < MIN_DATA_BUCKETS) {
        return <YieldChartSummary summary={summary} />;
    }

    return <YieldChartPlotContent summary={summary} isFailure={AsyncResult.isFailure(result)} />;
};
