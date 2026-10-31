import { isPositiveNumber } from '@rnw-community/shared';

import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';
import {
    RUNWAY_HISTORY_BAR_AREA_HEIGHT,
    RUNWAY_HISTORY_CHART_WIDTH,
    RUNWAY_HISTORY_PLOT_TOP,
    RUNWAY_HISTORY_PLOT_WIDTH
} from '../../constant/runway-history.constant';
import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';

interface Props {
    readonly value: number;
    readonly maxValue: number;
}

const MEDIAN_OPACITY = 0.6;
const LABEL_BASELINE_OFFSET = 4;

export const RunwayHistoryMedianLine = ({ value, maxValue }: Props) => {
    const formatChartAmount = useRunwayAmountLabel(0);

    const ratio = isPositiveNumber(maxValue) ? Math.min(value / maxValue, 1) : 0;
    const medianY = RUNWAY_HISTORY_PLOT_TOP + RUNWAY_HISTORY_BAR_AREA_HEIGHT * (1 - ratio);
    const labelY = medianY + LABEL_BASELINE_OFFSET;

    return (
        <>
            <StyledLine
                x1={0}
                y1={medianY}
                x2={RUNWAY_HISTORY_PLOT_WIDTH}
                y2={medianY}
                strokeClassName="accent-primary"
                strokeOpacity={MEDIAN_OPACITY}
                strokeWidth={1}
            />
            <StyledSvgText
                x={RUNWAY_HISTORY_CHART_WIDTH}
                y={labelY}
                fillClassName="accent-secondary-foreground"
                fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
                fontWeight="600"
                textAnchor="end"
            >
                {formatChartAmount(value)}
            </StyledSvgText>
        </>
    );
};
