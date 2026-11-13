import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { StyledPath } from '../../../@generic/component/styled-path/styled-path';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';

interface Props {
    readonly xs: readonly number[];
    readonly slot: number;
    readonly width: number;
}

const DIM_OPACITY = 0.6;
const HALF = 2;

const buildDimPath = (left: number, right: number) => ['M', left, ',', 0, 'H', right, 'V', YIELD_PLOT_HEIGHT, 'H', left, 'Z'].join('');

export const YieldChartDim = ({ xs, slot, width }: Props) => {
    const { selectedIndex } = use(YieldScreenContext);

    const selectedX = isDefined(selectedIndex) ? xs.at(selectedIndex) : null;

    if (!isDefined(selectedX)) {
        return null;
    }

    const leftDim = buildDimPath(0, selectedX - slot / HALF);
    const rightDim = buildDimPath(selectedX + slot / HALF, width);

    return (
        <>
            <StyledPath d={leftDim} fillClassName="accent-surface-row-opaque" fillOpacity={DIM_OPACITY} />
            <StyledPath d={rightDim} fillClassName="accent-surface-row-opaque" fillOpacity={DIM_OPACITY} />
        </>
    );
};
