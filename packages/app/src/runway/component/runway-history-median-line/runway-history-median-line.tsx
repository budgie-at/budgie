import { isPositiveNumber } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP
} from '../../constant/runway-history.constant';

interface Props {
    readonly value: number;
    readonly maxValue: number;
}

const MEDIAN_DASH = '2 3';

export const RunwayHistoryMedianLine = ({ value, maxValue }: Props) => {
    const ratio = isPositiveNumber(maxValue) ? Math.min(value / maxValue, 1) : 0;
    const medianY = RUNWAY_HISTORY_PLOT_TOP + RUNWAY_HISTORY_BAR_AREA_HEIGHT * (1 - ratio);

    return (
        <StyledLine
            x1={0}
            y1={medianY}
            x2={RUNWAY_HISTORY_CHART_WIDTH}
            y2={medianY}
            strokeClassName="accent-primary"
            strokeDasharray={MEDIAN_DASH}
            strokeWidth={1}
        />
    );
};
