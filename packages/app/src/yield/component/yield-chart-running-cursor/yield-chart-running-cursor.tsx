import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { YieldChartScrubRule } from '../yield-chart-scrub-rule/yield-chart-scrub-rule';

interface Props {
    readonly x: number;
    readonly y: number;
    readonly zeroY: number;
}

const DOT_RADIUS = 4;
const RING_WIDTH = 2;
const DOT_OUTER_RADIUS = DOT_RADIUS + RING_WIDTH / 2;

export const YieldChartRunningCursor = ({ x, y, zeroY }: Props) => (
    <>
        <YieldChartScrubRule x={x} height={zeroY} strokeClassName="accent-positive-action" />
        <StyledCircle
            cx={x}
            cy={y}
            r={DOT_OUTER_RADIUS}
            fillClassName="accent-positive-action"
            strokeClassName="accent-surface-row-opaque"
            strokeWidth={RING_WIDTH}
        />
    </>
);
