import { use } from 'react';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { isDefined, isString } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldChartAxis } from '../../hook/use-yield-chart-axis.hook';
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
const AREA_TOP_OPACITY = 0.12;
const AREA_FALLBACK_OPACITY = 0.08;
const DASH = '4 4';
const AREA_GRADIENT_ID = 'yield-running-total-area';
const LINE_CLASSNAME = 'accent-positive-action';

export const YieldChartRunningTotal = ({ width, summary }: Props) => {
    const { selectedIndex } = use(YieldSelectionContext);
    const lineColor = useCSSVariable('--color-positive-action');

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
    const priorAmount = isDefined(selectedIndex) ? (prior?.at(selectedIndex) ?? null) : null;
    const isScrubbing = isDefined(cursorX) && isDefined(cursorY);

    const label =
        isScrubbing && isDefined(priorAmount) ? <YieldChartScrubLabel priorAmount={priorAmount} x={cursorX} plotWidth={width} /> : null;

    return (
        <YieldChartFrame axis={axis} width={width} label={label}>
            <Defs>
                {isString(lineColor) ? (
                    <LinearGradient id={AREA_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={lineColor} stopOpacity={AREA_TOP_OPACITY} />
                        <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
                    </LinearGradient>
                ) : null}
            </Defs>
            {isString(lineColor) ? (
                <StyledPath d={paths.area} fill={`url(#${AREA_GRADIENT_ID})`} />
            ) : (
                <StyledPath d={paths.area} fillClassName={LINE_CLASSNAME} fillOpacity={AREA_FALLBACK_OPACITY} />
            )}
            <StyledPath
                d={paths.prior}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={PRIOR_WIDTH}
                strokeDasharray={DASH}
                fill="none"
            />
            <StyledPath d={paths.solid} strokeClassName={LINE_CLASSNAME} strokeWidth={LINE_WIDTH} fill="none" />
            <StyledPath d={paths.dashed} strokeClassName={LINE_CLASSNAME} strokeWidth={LINE_WIDTH} strokeDasharray={DASH} fill="none" />
            {isScrubbing ? <YieldChartRunningCursor x={cursorX} y={cursorY} /> : null}
        </YieldChartFrame>
    );
};
