import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';

interface Props {
    readonly x: number;
    readonly y: number;
    readonly zeroY: number;
}

const RULE_OPACITY = 0.6;
const DOT_RADIUS = 4;
const RING_WIDTH = 2;
const DOT_OUTER_RADIUS = DOT_RADIUS + RING_WIDTH / 2;

export const YieldChartRunningCursor = ({ x, y, zeroY }: Props) => (
    <>
        <StyledLine x1={x} y1={0} x2={x} y2={zeroY} strokeClassName="accent-positive-action" strokeWidth={1} strokeOpacity={RULE_OPACITY} />
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
