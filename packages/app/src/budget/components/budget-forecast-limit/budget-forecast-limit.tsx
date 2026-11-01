import { StyledLine } from '../../../@generic/component/styled-line/styled-line';
import { StyledSvgText } from '../../../@generic/component/styled-svg-text/styled-svg-text';

interface Props {
    readonly y: number;
    readonly left: number;
    readonly right: number;
    readonly label: string;
    readonly fontSize: number;
}

const LABEL_LIFT = 5;

export const BudgetForecastLimit = ({ y, left, right, label, fontSize }: Props) => {
    const labelY = y - LABEL_LIFT;

    return (
        <>
            <StyledLine x1={left} y1={y} x2={right} y2={y} strokeClassName="accent-secondary-corner" strokeWidth={1} />
            <StyledSvgText x={left} y={labelY} fillClassName="accent-secondary-foreground" fontSize={fontSize} textAnchor="start">
                {label}
            </StyledSvgText>
        </>
    );
};
