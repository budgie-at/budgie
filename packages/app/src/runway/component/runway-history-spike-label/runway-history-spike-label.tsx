import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';
import { RUNWAY_HISTORY_PLOT_TOP } from '../../constant/runway-history.constant';
import { useRunwayAmountLabel } from '../../hook/use-runway-amount-label.hook';

interface Props {
    readonly x: number;
    readonly expense: number;
}

const LABEL_Y = RUNWAY_HISTORY_PLOT_TOP - 4;

export const RunwayHistorySpikeLabel = ({ x, expense }: Props) => {
    const formatChartAmount = useRunwayAmountLabel(0);

    return (
        <StyledSvgText
            x={x}
            y={LABEL_Y}
            fillClassName="accent-attention-foreground"
            fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
            fontWeight="600"
            textAnchor="middle"
        >
            {formatChartAmount(expense)}
        </StyledSvgText>
    );
};
