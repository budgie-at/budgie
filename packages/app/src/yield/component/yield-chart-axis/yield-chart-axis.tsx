import { StyledLine } from '../../../@generic/component/styled-line/styled-line';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';

interface Props {
    readonly axis: YieldAxisInterface;
    readonly width: number;
    readonly height: number;
}

const GRID_DASH = '2 4';
const GRID_TOP = 1;
const LINE_WIDTH = 1;
const MID_OPACITY = 0.5;
const HALF = 2;

export const YieldChartAxis = ({ axis, width, height }: Props) => {
    const zeroY = (axis.top * height) / (axis.top - axis.bottom);
    const midY = zeroY / HALF;

    return (
        <>
            <StyledLine x1={0} y1={zeroY} x2={width} y2={zeroY} strokeClassName="accent-secondary-foreground" strokeWidth={LINE_WIDTH} />
            <StyledLine
                x1={0}
                y1={midY}
                x2={width}
                y2={midY}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={LINE_WIDTH}
                strokeDasharray={GRID_DASH}
                strokeOpacity={MID_OPACITY}
            />
            <StyledLine
                x1={0}
                y1={GRID_TOP}
                x2={width}
                y2={GRID_TOP}
                strokeClassName="accent-secondary-foreground"
                strokeWidth={LINE_WIDTH}
                strokeDasharray={GRID_DASH}
            />
        </>
    );
};
