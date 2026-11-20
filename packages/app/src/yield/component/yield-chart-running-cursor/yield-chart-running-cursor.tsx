import { StyledCircle } from '../../../@generic/component/styled-circle/styled-circle';
import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';

interface Props {
    readonly x: number;
    readonly y: number;
}

const GUIDE_OVERSHOOT = 4;
const RULE_OPACITY = 0.6;
const DOT_RADIUS = 4;
const RING_WIDTH = 2;
const DOT_OUTER_RADIUS = DOT_RADIUS + RING_WIDTH / 2;

export const YieldChartRunningCursor = ({ x, y }: Props) => (
    <>
        <StyledLine
            x1={x}
            y1={-GUIDE_OVERSHOOT}
            x2={x}
            y2={YIELD_PLOT_HEIGHT}
            strokeClassName="accent-primary"
            strokeWidth={1}
            strokeOpacity={RULE_OPACITY}
        />
        <StyledCircle
            cx={x}
            cy={y}
            r={DOT_OUTER_RADIUS}
            fillClassName="accent-primary"
            strokeClassName="accent-surface-row-opaque"
            strokeWidth={RING_WIDTH}
        />
    </>
);
