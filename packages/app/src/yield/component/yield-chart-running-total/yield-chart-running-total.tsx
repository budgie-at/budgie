import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldChartAxis } from '../../hook/use-yield-chart-axis.hook';
import { buildYieldRunningPaths } from '../../utils/build-yield-running-paths.util';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldChartFrame } from '../yield-chart-frame/yield-chart-frame';
import { YieldChartRunningArea } from '../yield-chart-running-area/yield-chart-running-area';
import { YieldChartRunningCursor } from '../yield-chart-running-cursor/yield-chart-running-cursor';
import { YieldChartScrubLabel } from '../yield-chart-scrub-label/yield-chart-scrub-label';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly width: number;
    readonly summary: YieldSummaryInterface;
}

const LINE_WIDTH = 2;
const PRIOR_WIDTH = 1.5;
const DASH = '3 3';
const PRIOR_DOT_RADIUS = 3.2;
const PRIOR_RING_WIDTH = 2;
const LINE_CLASSNAME = 'accent-positive-action';

export const YieldChartRunningTotal = ({ width, summary }: Props) => {
    const { selectedIndex } = use(YieldSelectionContext);
    const { formatMonthAndDay } = useFormatDate();

    const cumulative = buildYieldRunningTotal(summary.buckets.map(bucket => bucket.total));
    const prior = isDefined(summary.priorTotals) ? buildYieldRunningTotal(summary.priorTotals) : null;
    const axis = useYieldChartAxis(summary);
    const paths = buildYieldRunningPaths({
        cumulative,
        prior,
        inProgress: summary.buckets.map(bucket => bucket.isInProgress),
        axisTop: axis.top,
        axisBottom: axis.bottom,
        width,
        height: YIELD_PLOT_HEIGHT
    });
    const cursorX = isDefined(selectedIndex) ? paths.xs.at(selectedIndex) : null;
    const cursorY = isDefined(selectedIndex) ? paths.ys.at(selectedIndex) : null;
    const zeroY = (axis.top * YIELD_PLOT_HEIGHT) / (axis.top - axis.bottom);
    const isScrubbing = isDefined(cursorX) && isDefined(cursorY);

    const priorY = isDefined(selectedIndex) ? paths.priorYs.at(selectedIndex) : null;
    const scrubbedBucket = isDefined(selectedIndex) ? summary.buckets.at(selectedIndex) : null;

    const label =
        isScrubbing && isDefined(scrubbedBucket) ? (
            <YieldChartScrubLabel title={formatMonthAndDay(parseISO(scrubbedBucket.end))} x={cursorX} plotWidth={width} />
        ) : null;

    return (
        <YieldChartFrame axis={axis} width={width} label={label}>
            <YieldChartRunningArea path={paths.area} />
            <StyledPath
                d={paths.prior}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={PRIOR_WIDTH}
                strokeOpacity={0.6}
                fill="none"
            />
            <StyledPath d={paths.solid} strokeClassName={LINE_CLASSNAME} strokeWidth={LINE_WIDTH} fill="none" />
            <StyledPath d={paths.dashed} strokeClassName={LINE_CLASSNAME} strokeWidth={LINE_WIDTH} strokeDasharray={DASH} fill="none" />
            {isScrubbing ? <YieldChartRunningCursor x={cursorX} y={cursorY} zeroY={zeroY} /> : null}
            {isScrubbing && isDefined(priorY) ? (
                <StyledCircle
                    cx={cursorX}
                    cy={priorY}
                    r={PRIOR_DOT_RADIUS}
                    fillClassName="accent-secondary-foreground"
                    strokeClassName="accent-surface-row-opaque"
                    strokeWidth={PRIOR_RING_WIDTH}
                />
            ) : null}
        </YieldChartFrame>
    );
};
