import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { buildYieldAxis } from '../../utils/build-yield-axis.util';
import { buildYieldRunningPaths } from '../../utils/build-yield-running-paths.util';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldChartFrame } from '../yield-chart-frame/yield-chart-frame';
import { YieldChartRunningCursor } from '../yield-chart-running-cursor/yield-chart-running-cursor';
import { YieldChartScrubLabel } from '../yield-chart-scrub-label/yield-chart-scrub-label';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const LINE_WIDTH = 2;
const PRIOR_WIDTH = 1.5;
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
    const selectedBucket = isDefined(selectedIndex) ? summary.buckets.at(selectedIndex) : null;
    const cursorX = isDefined(selectedIndex) ? paths.xs.at(selectedIndex) : null;
    const cursorY = isDefined(selectedIndex) ? paths.ys.at(selectedIndex) : null;
    const cursorAmount = isDefined(selectedIndex) ? cumulative.at(selectedIndex) : null;
    const isScrubbing = isDefined(selectedBucket) && isDefined(cursorX) && isDefined(cursorY) && isDefined(cursorAmount);

    const label = isScrubbing ? (
        <YieldChartScrubLabel bucket={selectedBucket} unit={summary.bucketUnit} amount={cursorAmount} x={cursorX} plotWidth={width} />
    ) : null;

    return (
        <YieldChartFrame axis={axis} width={width} label={label}>
            <StyledPath d={paths.area} fillClassName="accent-primary" fillOpacity={AREA_OPACITY} />
            <StyledPath
                d={paths.prior}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={PRIOR_WIDTH}
                strokeDasharray={DASH}
                fill="none"
            />
            <StyledPath d={paths.solid} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} fill="none" />
            <StyledPath d={paths.dashed} strokeClassName="accent-primary" strokeWidth={LINE_WIDTH} strokeDasharray={DASH} fill="none" />
            {isScrubbing ? <YieldChartRunningCursor x={cursorX} y={cursorY} /> : null}
        </YieldChartFrame>
    );
};
