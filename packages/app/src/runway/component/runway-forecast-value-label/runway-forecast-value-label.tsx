import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';

interface Props {
    readonly x: number;
    readonly y: number;
    readonly label: string;
    readonly anchor: 'start' | 'end';
}

export const RunwayForecastValueLabel = ({ x, y, label, anchor }: Props) => (
    <StyledSvgText x={x} y={y} fillClassName="accent-primary" fontSize={RUNWAY_CHART_LABEL_FONT_SIZE} fontWeight="600" textAnchor={anchor}>
        {label}
    </StyledSvgText>
);
