import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';
import { RUNWAY_CHART_LABEL_FONT_SIZE } from '../../constant/runway-chart-label-font-size.constant';

interface Props {
    readonly x: number;
    readonly y: number;
    readonly label: string;
    readonly isSpike: boolean;
    readonly hasLabel: boolean;
}

export const RunwayHistoryMonthLabel = ({ x, y, label, isSpike, hasLabel }: Props) => {
    if (!hasLabel) {
        return null;
    }

    const fillClassName = isSpike ? 'accent-primary' : 'accent-secondary-foreground';
    const fontWeight = isSpike ? '600' : '400';

    return (
        <StyledSvgText
            x={x}
            y={y}
            fillClassName={fillClassName}
            fontSize={RUNWAY_CHART_LABEL_FONT_SIZE}
            fontWeight={fontWeight}
            textAnchor="middle"
        >
            {label}
        </StyledSvgText>
    );
};
