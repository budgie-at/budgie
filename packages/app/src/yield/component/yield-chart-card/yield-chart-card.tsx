import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldChartModeControl } from '../yield-chart-mode-control/yield-chart-mode-control';
import { YieldChartPlot } from '../yield-chart-plot/yield-chart-plot';
import { YieldChartSummary } from '../yield-chart-summary/yield-chart-summary';
import { YieldLegendFootnote } from '../yield-legend-footnote/yield-legend-footnote';
import { YieldLegendRunning } from '../yield-legend-running/yield-legend-running';
import { YieldLegend } from '../yield-legend/yield-legend';

const YIELD_MIN_DATA_BUCKETS = 3;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const YieldChartCard = () => {
    const { mode } = use(YieldScreenContext);
    const summary = useYieldSummary();

    const isCompact = isDefined(summary) && summary.buckets.filter(bucket => bucket.total > 0).length < YIELD_MIN_DATA_BUCKETS;
    const isRunning = !isCompact && mode === YieldChartModeEnum.RUNNING_TOTAL;
    const legend = mode === YieldChartModeEnum.BARS ? <YieldLegend /> : <YieldLegendRunning />;

    return (
        <View
            className="gap-y-[12px] rounded-3xl bg-surface-row p-[16px] dark:border-[0.5px] dark:border-surface-separator"
            style={CONTINUOUS_CORNERS}
        >
            {isCompact && isDefined(summary) ? (
                <YieldChartSummary summary={summary} />
            ) : (
                <>
                    <YieldChartModeControl />

                    <YieldChartPlot />

                    {legend}
                </>
            )}

            {isRunning ? null : <YieldLegendFootnote />}
        </View>
    );
};
