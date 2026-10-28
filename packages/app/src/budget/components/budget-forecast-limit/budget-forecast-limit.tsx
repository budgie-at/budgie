import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

interface Props {
    readonly y: number;
    readonly left: number;
    readonly right: number;
    readonly label: string;
    readonly fontSize: number;
    readonly dash: string;
}

const LABEL_GAP = 4;

export const BudgetForecastLimit = ({ y, left, right, label, fontSize, dash }: Props) => {
    const labelY = y - LABEL_GAP;

    return (
        <>
            <StyledLine
                x1={left}
                y1={y}
                x2={right}
                y2={y}
                strokeClassName="accent-secondary-foreground"
                strokeDasharray={dash}
                strokeWidth={1}
            />
            <StyledSvgText x={right} y={labelY} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="end">
                {label}
            </StyledSvgText>
        </>
    );
};
