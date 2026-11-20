import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { buildYieldAxisTicks } from '../../utils/build-yield-axis-ticks.util';

import type { YieldAxisInterface } from '../../interface/yield-axis.interface';

interface Props {
    readonly axis: YieldAxisInterface;
    readonly width: number;
    readonly height: number;
}

const GRID_WIDTH = 0.5;
const GRID_OPACITY = 0.08;
const LINE_WIDTH = 1;
const ZERO_OPACITY = 0.4;

export const YieldChartAxis = ({ axis, width, height }: Props) => {
    const { zeroY, ticks } = buildYieldAxisTicks(axis, height);

    return (
        <>
            <StyledLine
                x1={0}
                y1={zeroY}
                x2={width}
                y2={zeroY}
                strokeClassName="accent-primary"
                strokeWidth={LINE_WIDTH}
                strokeOpacity={ZERO_OPACITY}
            />
            {ticks.map(({ key, y }) => (
                <StyledLine
                    key={key}
                    x1={0}
                    y1={y}
                    x2={width}
                    y2={y}
                    strokeClassName="accent-primary"
                    strokeWidth={GRID_WIDTH}
                    strokeOpacity={GRID_OPACITY}
                />
            ))}
        </>
    );
};
