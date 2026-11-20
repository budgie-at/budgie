import { use } from 'react';
import { View } from 'react-native';
import Svg from 'react-native-svg';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { buildYieldAxis } from '../../utils/build-yield-axis.util';
import { buildYieldRunningPaths } from '../../utils/build-yield-running-paths.util';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldChartAxisLabels } from '../yield-chart-axis-labels/yield-chart-axis-labels';
import { YieldChartAxis } from '../yield-chart-axis/yield-chart-axis';
import { YieldChartRunningCursor } from '../yield-chart-running-cursor/yield-chart-running-cursor';
import { YieldChartScrubLabel } from '../yield-chart-scrub-label/yield-chart-scrub-label';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const LINE_WIDTH = 2;
const PRIOR_WIDTH = 1;
const AREA_OPACITY = 0.08;
const DASH = '4 4';

export const YieldChartRunningTotal = ({ width, summary }: Props) => {
    const { selectedIndex } = use(YieldSelectionContext);

    const cumulative = buildYieldRunningTotal(summary.buckets.map(bucket => bucket.total));
    const prior = isDefined(summary.priorTotals) ? buildYieldRunningTotal(summary.priorTotals) : null;
    const axis = buildYieldAxis(Math.max(0, ...cumulative, ...(prior ?? [])), 0);
    const paths = buildYieldRunningPaths({
        cumulative,
        prior,
        inProgress: summary.buckets.map(bucket => bucket.isInProgress),
        axisTop: axis.top,
        width,
        height: YIELD_PLOT_HEIGHT
    });
    const containerStyle = { width: width + YIELD_AXIS_GUTTER, height: YIELD_PLOT_HEIGHT };
    const selectedBucket = isDefined(selectedIndex) ? summary.buckets.at(selectedIndex) : null;
    const cursorX = isDefined(selectedIndex) ? paths.xs.at(selectedIndex) : null;
    const cursorY = isDefined(selectedIndex) ? paths.ys.at(selectedIndex) : null;
    const cursorAmount = isDefined(selectedIndex) ? cumulative.at(selectedIndex) : null;
    const isScrubbing = isDefined(selectedBucket) && isDefined(cursorX) && isDefined(cursorY) && isDefined(cursorAmount);

    return (
        <View style={containerStyle}>
            <Svg width={width} height={YIELD_PLOT_HEIGHT}>
                <YieldChartAxis axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />
                <StyledPath d={paths.area} fillClassName="accent-primary" fillOpacity={AREA_OPACITY} />
                <StyledPath d={paths.prior} strokeClassName="accent-secondary-foreground" strokeWidth={PRIOR_WIDTH} fill="none" />
                <StyledPath d={paths.solid} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} fill="none" />
                <StyledPath d={paths.dashed} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} strokeDasharray={DASH} fill="none" />
                {isScrubbing ? <YieldChartRunningCursor x={cursorX} y={cursorY} /> : null}
            </Svg>

            <YieldChartAxisLabels axis={axis} width={width} height={YIELD_PLOT_HEIGHT} />

            {isScrubbing ? (
                <YieldChartScrubLabel
                    bucket={selectedBucket}
                    unit={summary.bucketUnit}
                    amount={cursorAmount}
                    x={cursorX}
                    y={cursorY}
                    plotWidth={width}
                />
            ) : null}
        </View>
    );
};
