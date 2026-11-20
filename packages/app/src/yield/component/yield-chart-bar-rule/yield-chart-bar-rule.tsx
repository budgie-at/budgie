import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { getYieldBarCenterX } from '../../utils/get-yield-bar-center-x.util';

interface Props {
    readonly index: number;
    readonly count: number;
    readonly width: number;
}

const RULE_OPACITY = 0.6;

export const YieldChartBarRule = ({ index, count, width }: Props) => {
    const x = getYieldBarCenterX(index, count, width);

    return (
        <StyledLine
            x1={x}
            y1={0}
            x2={x}
            y2={YIELD_PLOT_HEIGHT}
            strokeClassName="accent-secondary-foreground"
            strokeWidth={1}
            strokeOpacity={RULE_OPACITY}
        />
    );
};
